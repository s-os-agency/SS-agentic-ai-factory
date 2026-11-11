# S/A2A — Hugging Face model sources

Canonical model selection and upstream repositories for the existing S/A2A agent.

| Tier | Hugging Face model | Upstream GitHub | Purpose |
|---|---|---|---|
| Default | [Qwen2.5-Omni-3B](https://huggingface.co/Qwen/Qwen2.5-Omni-3B) | [Qwen2.5-Omni](https://github.com/QwenLM/Qwen2.5-Omni) | Existing Gradio baseline; text/image/audio/video input and text/speech output |
| Advanced | [Qwen3-Omni-30B-A3B-Instruct](https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct) | [Qwen3-Omni](https://github.com/QwenLM/Qwen3-Omni) | Higher-capacity opt-in; requires a separate model-specific adapter and suitable GPU |

Source manifest: [models.json](models.json). GitHub stores **links, code and integration contracts**, not upstream model weights.

## Reuse model repositories

```bash
git clone https://github.com/QwenLM/Qwen2.5-Omni.git
git clone https://github.com/QwenLM/Qwen3-Omni.git
```

These are upstream source repositories; their code is not vendored into S/Agency. The manifest records intended integration, not deployment or inference success.

## Run existing baseline

```bash
cd agents/s-a2a-agent
pip install -r requirements.txt
S_A2A_MODEL=Qwen/Qwen2.5-Omni-3B python app.py
```

The advanced model **cannot** be substituted into the existing baseline merely by changing the model ID without checking its runtime API and hardware requirements.

## Capability boundary

The Hugging Face `any-to-any` classification is multimodal understanding with text/speech responses. **Image/video generation and arbitrary modality-to-modality conversions are not claimed.** Those require separately selected and implemented adapters. Both selected Hub entries currently advertise `license:other`; inspect upstream model cards and licenses before commercial redistribution.

## Source status

Metadata inspected 2026-11-11 using the connected Hugging Face account. Registered in GitHub; no model weights downloaded, Space published, inference endpoint deployed or GPU job run.
