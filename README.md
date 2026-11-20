# Skyla Platform

**Apps and tools on top of [Skyla Kernel](https://github.com/maulanasdqn/skyla-kernel):
the `skyla` command line, a terminal chat, a browser chat UI (Rust/WebAssembly) that can
switch between models at runtime, and Skyla Runtime, an iPhone app.**

The kernels, the engine and the CPU reference live in skyla-kernel; this repository
depends on them through path dependencies, so check both out side by side:

```sh
git clone https://github.com/maulanasdqn/skyla-kernel.git
git clone https://github.com/maulanasdqn/skyla-platform.git
cd skyla-platform
cargo build --release
```

Build requirements (Rust, `glslc`, the Vulkan SDK on Windows) are listed in the
skyla-kernel README.

## Get models

Any GGUF of the `qwen3`, `qwen3moe` or `qwen35` architecture with Q8_0, Q4_K or Q6_K weights works
(abliterated variants included, e.g. Huihui-Qwen3-30B-A3B-Instruct-2507-abliterated). Keep one
folder per model under a common directory so the browser UI can list them:

```powershell
mkdir models\r1-8b, models\qwen3-4b
curl -L -o models\r1-8b\r1-8b.gguf https://huggingface.co/mradermacher/Josiefied-DeepSeek-R1-0528-Qwen3-8B-abliterated-v1-GGUF/resolve/main/Josiefied-DeepSeek-R1-0528-Qwen3-8B-abliterated-v1.Q4_K_M.gguf
curl -L -o models\qwen3-4b\qwen3-4b.gguf https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf
```

The chat template is detected from the GGUF: DeepSeek-R1 (`<｜User｜>…<｜Assistant｜>`) or
ChatML (`<|im_start|>…<|im_end|>`, Qwen3 Instruct).

## Browser chat UI

The UI is a Leptos app compiled to WebAssembly with [trunk](https://trunkrs.dev/); the
server is axum and streams tokens over a WebSocket. The engine stays native: Vulkan does
not run in a browser.

```powershell
rustup target add wasm32-unknown-unknown
cargo install trunk --locked
cd skyla-web; trunk build --release; cd ..
./target/release/skyla serve models\qwen3-4b\qwen3-4b.gguf
```

Open <http://127.0.0.1:8080>. The header's model menu lists every GGUF under `models\`
(`--models <dir>` to point elsewhere) and switches models in a few seconds, marking
architectures Skyla cannot run yet. Replies stream with the thinking section collapsible,
**Stop** interrupts generation, **New chat** clears the context, and **Settings** holds
temperature, top-p, the reply length limit and a system prompt (for example a game
character's persona). Every reply shows its token count, speed and context use.

## iPhone app

`ios/` holds **Skyla Runtime**, a SwiftUI chat app that runs the same engine on the
iPhone's GPU through `skyla-ffi`, a static library with a small C interface. It downloads
models inside the app, or loads any `.gguf` put in its folder in the Files app, with a 4K
context. Qwen3 4B generates at about 17.6 tok/s on an iPhone 17 Pro. The catalog also offers
DeepSeek V4 Pro Qwen3.5 9B (uncensored, Q4_K_M), which needs about 6 GB of memory.

For roleplay in Indonesian, SEA-LION v4 4B (decensored), AI Singapore's Southeast Asian
fine-tune of Qwen3-VL, wrote the most natural Indonesian of six 4B-class candidates
tested with the same two roleplay scenes; Qwen3 4B abliterated and roleplay fine-tunes
of Qwen3 4B came out stiff or repetitive.

```sh
brew install xcodegen
rustup target add aarch64-apple-ios
cd ios && xcodegen generate
xcodebuild -project Skyla.xcodeproj -scheme Skyla -configuration Release \
  -destination "id=<device UDID>" -allowProvisioningUpdates build
xcrun devicectl device install app --device <device UDID> build/Build/Products/Release-iphoneos/Skyla.app
```

Set `DEVELOPMENT_TEAM` in `ios/project.yml` to your team and sign in to Xcode first. The
Xcode build compiles the Rust engine for `aarch64-apple-ios` itself. With a free Apple
account the app has to be reinstalled every 7 days.

## Terminal chat

```powershell
./target/release/skyla chat models\r1-8b\r1-8b.gguf
```

Replies stream as they are generated, with the model's `<think>` section dimmed. `/reset`
clears the conversation and an empty line quits.

```
> Berapa 17 x 23? Jawab singkat.
<think>
Hmm, user is asking for the multiplication of 17 and 23 with a request for a short answer.
...
17 × 20 = 340, and 17 × 3 = 51, so 340 + 51 = 391. Yeah, that's correct.
...
</think>

391
[18 prompt tokens in 428.5ms | 253 tokens at 7.36 tok/s | context 271/16384]
```

(`--temp 0`, thinking shortened here.)

## Commands

| Command | What it does |
|---|---|
| `skyla serve <model>` | Browser chat UI on `--addr` (default `127.0.0.1:8080`); `--models <dir>` sets the folder listed in the model menu, `--web <dir>` the built UI |
| `skyla chat <model>` | Terminal chat with the model's own template (DeepSeek-R1 or ChatML) |
| `skyla run <model> --tokens <ids>` | Greedy decode from token ids; `--check` compares every step with the CPU reference, `--profile` times every GPU stage |
| `skyla ref <model> --tokens <ids>` | Greedy decode with the CPU reference; `--expect <ids>` teacher-forces another engine's output |
| `skyla tokenize <model> <text>` | Token ids from the model's tokenizer |
| `skyla gguf-info <model>` | Metadata and tensor summary |
| `skyla probe` | Vulkan device, features, limits and memory types |
| `skyla bench-bw` | Read bandwidth of every GPU memory type and of the CPU |

`chat` options:

| Option | Default | |
|---|---|---|
| `--ctx` | 16384 | Context length (KV cache size) |
| `--kv` | `v8` | KV cache precision: `f16`, `v8` (f16 keys, int8 values) or `q8` |
| `--max-tokens` | 4096 | Tokens per reply, thinking included |
| `--temp` / `--top-k` / `--top-p` | 0.6 / 40 / 0.95 | DeepSeek's recommended R1 sampling; `--temp 0` is greedy |
| `--seed` | time | Sampling seed |
| `--system` | none | System prompt |

Environment: `SKYLA_VALIDATION=1` enables the Khronos validation layer, `SKYLA_DEVICE=<n>`
selects a device other than the first integrated GPU. On macOS the Vulkan loader is found
in `/opt/homebrew/lib`, `/usr/local/lib` or `$VULKAN_SDK/lib`; Homebrew's validation layer
also needs `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib`.


## Correctness

`skyla run --check` runs the GPU engine and the CPU reference in lockstep and reports the
top token and the largest logit difference at every step. The tokenizer produces ids
identical to `llama-tokenize` on emoji, CJK, code, CRLF, contractions, numbers and full
chat prompts.

## Repository layout

| Crate | Role |
|---|---|
| `skyla-tok` | Byte-level BPE tokenizer read from GGUF metadata |
| `skyla-chat` | Chat sessions: template detection (DeepSeek-R1, ChatML), sampling, UTF-8 streaming, `<think>` tracking |
| `skyla-types` | Messages shared by the server and the WebAssembly UI |
| `skyla-server` | axum server: WebSocket streaming with stop and reset, model catalog and switching, static UI; the engine runs on its own thread |
| `skyla-web` | Leptos chat UI compiled to WebAssembly |
| `skyla-cli` | The `skyla` binary |
| `skyla-ffi` | C interface to chat sessions (open, streaming chat, cancel, reset), built as a static library for the iOS app |
| `skyla-image` | Swift package for on-device Stable Diffusion, used by the iOS app |
| `ios/` | SwiftUI iPhone app (XcodeGen project) |

## Limitations

- One conversation at a time, shared by every browser tab.
- Earlier turns keep their `<think>` text in context, unlike the reference chat template,
  to avoid re-processing them.

## License

[MIT](LICENSE)
