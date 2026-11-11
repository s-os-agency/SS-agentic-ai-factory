"""Agent CLI for Ming-flash-omni-2.0 text inference.

Install the dependencies from https://github.com/inclusionAI/Ming and set
MING_SOURCE_DIR to that checkout. Requires CUDA hardware sized for the model.
Run: python agents/ming_omni.py "Your prompt"
"""
import argparse
import os
import sys
from pathlib import Path

MODEL_ID = "inclusionAI/Ming-flash-omni-2.0"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("prompt")
    parser.add_argument("--model-path", default=MODEL_ID)
    parser.add_argument("--max-new-tokens", type=int, default=256)
    args = parser.parse_args()
    source_dir = os.environ.get("MING_SOURCE_DIR")
    if not source_dir or not (Path(source_dir) / "modeling_bailingmm2.py").is_file():
        parser.error("Set MING_SOURCE_DIR to an inclusionAI/Ming checkout.")
    if args.max_new_tokens < 1:
        parser.error("--max-new-tokens must be positive.")

    sys.path.insert(0, str(Path(source_dir).resolve()))
    import torch
    from modeling_bailingmm2 import BailingMM2NativeForConditionalGeneration
    from transformers import AutoProcessor

    if not torch.cuda.is_available():
        parser.error("Ming-flash-omni-2.0 requires a CUDA runtime for this entry point.")

    model = BailingMM2NativeForConditionalGeneration.from_pretrained(
        args.model_path,
        torch_dtype=torch.bfloat16,
        attn_implementation="flash_attention_2",
        device_map="auto",
        load_image_gen=False,
        load_talker=False,
    ).eval()
    processor = AutoProcessor.from_pretrained(args.model_path, trust_remote_code=True)
    messages = [{"role": "HUMAN", "content": [{"type": "text", "text": args.prompt}]}]
    prompt = processor.apply_chat_template(messages)
    inputs = processor(text=[prompt], return_tensors="pt").to(model.device)
    with torch.inference_mode():
        tokens = model.generate(
            **inputs,
            max_new_tokens=args.max_new_tokens,
            eos_token_id=processor.gen_terminator,
        )
    completion = tokens[:, inputs.input_ids.shape[1]:]
    print(processor.batch_decode(completion, skip_special_tokens=True)[0])


if __name__ == "__main__":
    main()
