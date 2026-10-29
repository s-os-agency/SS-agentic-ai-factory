#!/usr/bin/env python3
"""Bounded local worker handlers for the existing S/ factory. No arbitrary shell."""
import argparse, datetime, fcntl, hashlib, html.parser, json, os, pathlib, sqlite3, subprocess, sys, time, urllib.request, uuid
ROOT=pathlib.Path(__file__).resolve().parents[1]
STATE=ROOT/"logs"/"workers"
STATE.mkdir(parents=True,exist_ok=True)
os.chmod(STATE,0o700)
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def command(args):
 r=subprocess.run(args,capture_output=True,text=True,timeout=15)
 return {"exit":r.returncode,"stdout":r.stdout[:10000],"stderr":r.stderr[:1000]}
def health(_):
 out={}
 for name,port,path in [("n8n",5678,"/healthz"),("university",8787,"/health"),("gateway",4317,"/healthz")]:
  try:
   with urllib.request.urlopen("http://127.0.0.1:%s%s"%(port,path),timeout=5) as r:
    body=r.read(4096).decode(); parsed=json.loads(body)
    out[name]={"http":r.status,"body":parsed,"ok":r.status==200}
  except Exception as e: out[name]={"ok":False,"error":type(e).__name__}
 for name in ["agent-passport","aria","s-agentic-university","s-agent-mcp-gateway"]:
  out[name+"-unit"]=command(["systemctl","is-active",name])
 return {"services":out,"all_http_ok":all(out[n].get("ok") for n in ["n8n","university","gateway"])}
def repos(_):
 rows=[]
 roots=[pathlib.Path.home()/"services",ROOT.parent]
 seen=set()
 for root in roots:
  for p in sorted(root.iterdir()):
   if p.is_dir() and (p/".git").exists() and str(p) not in seen:
    seen.add(str(p)); rows.append({"path":str(p),"head":command(["git","-C",str(p),"rev-parse","HEAD"])["stdout"].strip(),"changes":command(["git","-C",str(p),"status","--porcelain"])["stdout"].splitlines()[:50]})
 return {"repositories":rows,"scope":"local checkouts only; not a refreshed GitHub estate census"}
def inventory(_):
 return {"hostname":command(["hostname"])["stdout"].strip(),"uptime":command(["uptime"])["stdout"].strip(),"memory":command(["free","-m"])["stdout"],"disk":command(["df","-h","/"])["stdout"],"containers":command(["docker","ps","-a","--format","{{.Names}}\t{{.Status}}\t{{.Ports}}"])}
def tabs(data):
 items=data.get("tabs")
 if not isinstance(items,list) or len(items)>1000: raise ValueError("tabs must be a list of at most 1000 objects")
 result=[]
 for t in items:
  if not isinstance(t,dict): raise ValueError("each tab must be an object")
  u=t.get("url","")
  if not isinstance(u,str) or len(u)>4096 or not u.startswith(("https://","http://")): raise ValueError("only HTTP(S) tab URLs are supported")
  result.append({"url":u,"title":str(t.get("title",""))[:1000],"group":str(t.get("group",""))[:200]})
 return {"tabs":result,"links":"\n".join(t["url"] for t in result),"restored":False}
class Extractor(html.parser.HTMLParser):
 def __init__(self): super().__init__();self.links=[];self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=="a" and a.get("href","").startswith(("https://","http://")):self.links.append(a["href"])
  if tag=="tr":self.row=[]
  if tag in ("td","th") and self.row is not None:self.cell=[]
 def handle_data(self,data):
  if self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if tag in ("td","th") and self.cell is not None:self.row.append(" ".join("".join(self.cell).split()));self.cell=None
  if tag=="tr" and self.row is not None:
   if self.row:self.rows.append(self.row)
   self.row=None
def extract(data):
 s=data.get("html","")
 if not isinstance(s,str) or len(s)>500000:raise ValueError("html must be a string under 500000 characters")
 p=Extractor();p.feed(s)
 return {"links":list(dict.fromkeys(p.links))[:1000],"rows":p.rows[:1000],"source":"supplied HTML; no browser or network extraction"}
HANDLERS={"runtime.health":health,"runtime.inventory":inventory,"repository.inventory":repos,"tabs.export":tabs,"scraper.html":extract}
PERIODIC={"runtime.health":300,"runtime.inventory":900,"repository.inventory":3600}
db=sqlite3.connect(STATE/"queue.sqlite",timeout=20)
db.row_factory=sqlite3.Row
db.execute("pragma journal_mode=WAL")
db.execute("create table if not exists jobs(id text primary key,key text unique,handler text,payload text,status text,attempts integer default 0,created text,started text,finished text,result_path text,error text)")
db.commit()
def enqueue(handler,payload,key):
 if handler not in HANDLERS:raise ValueError("unknown handler")
 if len(json.dumps(payload))>600000:raise ValueError("payload too large")
 jid=str(uuid.uuid4())
 db.execute("insert or ignore into jobs(id,key,handler,payload,status,created) values(?,?,?,?,?,?)",(jid,key,handler,json.dumps(payload),"pending",now()));db.commit()
 return dict(db.execute("select id,handler,status from jobs where key=?",(key,)).fetchone())
def tick():
 with open(STATE/"tick.lock","w") as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:return {"status":"already_running"}
  # A terminated process can leave a running row; retry only these bounded, idempotent handlers.
  db.execute("update jobs set status=case when attempts<3 then 'pending' else 'failed' end,error='worker_interrupted' where status='running'");db.commit()
  for name,seconds in PERIODIC.items():enqueue(name,{},"periodic:%s:%s"%(name,int(time.time())//seconds))
  receipts=[]
  for row in db.execute("select * from jobs where status='pending' and attempts<3 order by created limit 12").fetchall():
   db.execute("update jobs set status='running',attempts=attempts+1,started=? where id=?",(now(),row["id"]));db.commit()
   try:
    result=HANDLERS[row["handler"]](json.loads(row["payload"]))
    receipt={"operation_id":row["id"],"handler":row["handler"],"started":dict(db.execute("select started from jobs where id=?",(row["id"],)).fetchone())["started"],"finished":now(),"execution":"completed","result":result}
    path=STATE/(row["id"]+".json")
    temp=path.with_suffix(".tmp");temp.write_text(json.dumps(receipt,ensure_ascii=False,indent=2));os.chmod(temp,0o600);temp.replace(path)
    db.execute("update jobs set status='completed',finished=?,result_path=?,error=null where id=?",(now(),str(path),row["id"]))
    receipts.append({"id":row["id"],"handler":row["handler"],"status":"completed","receipt":str(path)})
   except Exception as e:
    db.execute("update jobs set status='failed',finished=?,error=? where id=?",(now(),str(e)[:500],row["id"]))
    receipts.append({"id":row["id"],"handler":row["handler"],"status":"failed","error":str(e)[:500]})
   db.commit()
  summary={"timestamp":now(),"receipts":receipts,"handlers":list(HANDLERS),"model_workers":"not_configured","scope":"bounded local operations; no autonomous LLM coding, purchases, messaging, deployment or arbitrary shell"}
  (STATE/"latest.json").write_text(json.dumps(summary,indent=2))
  return summary
p=argparse.ArgumentParser();sub=p.add_subparsers(dest="cmd",required=True)
sub.add_parser("tick");sub.add_parser("status");sub.add_parser("handlers")
e=sub.add_parser("enqueue");e.add_argument("handler",choices=HANDLERS);e.add_argument("--input-json",default="{}");e.add_argument("--key",required=True)
e=sub.add_parser("result");e.add_argument("id")
e=sub.add_parser("cancel");e.add_argument("id")
a=p.parse_args()
if a.cmd=="tick":out=tick()
elif a.cmd=="handlers":out={"handlers":list(HANDLERS),"periodic_seconds":PERIODIC}
elif a.cmd=="enqueue":out=enqueue(a.handler,json.loads(a.input_json),a.key)
elif a.cmd=="status":out={"jobs":[dict(r) for r in db.execute("select id,handler,status,attempts,finished,result_path,error from jobs order by created desc limit 25")],"handlers":list(HANDLERS)}
elif a.cmd=="result":
 row=db.execute("select * from jobs where id=?",(a.id,)).fetchone()
 if not row:raise SystemExit("unknown job")
 out=json.loads(pathlib.Path(row["result_path"]).read_text()) if row["result_path"] else dict(row)
elif a.cmd=="cancel":
 db.execute("update jobs set status='cancelled',finished=? where id=? and status='pending'",(now(),a.id));db.commit();out={"cancelled":bool(db.total_changes),"scope":"pending jobs only"}
print(json.dumps(out,ensure_ascii=False))
db.close()
