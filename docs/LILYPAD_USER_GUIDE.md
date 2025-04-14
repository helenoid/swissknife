# Lilypad User Guide

This guide provides instructions for using Lilypad models with the swissknife application.

## What is Lilypad?

Lilypad is a distributed compute network that provides access to various open-source AI models through its Anura API. With this integration, you can now use these models directly within swissknife.

## Available Models

Lilypad offers a variety of models for different purposes:

### Text Generation Models

| Model | Description | Max Tokens | Function Calling |
|-------|-------------|------------|-----------------|
| llama3.1:8b | Meta's latest LLaMA model | 8192 | Yes |
| qwen2.5:7b | Alibaba's Qwen 2.5 model | 8192 | Yes |
| qwen2.5-coder:7b | Code-specialized version of Qwen 2.5 | 8192 | Yes |
| phi4-mini:3.8b | Microsoft's Phi-4 smaller model | 8192 | Yes |
| mistral:7b | Mistral AI's base model | 8192 | Yes |
| llama2:7b | Meta's LLaMA 2 model | 8192 | No |
| deepseek-r1:7b | DeepSeek AI's R1 model | 8192 | No |

### Image Generation Models

| Model | Description |
|-------|-------------|
| sdxl-turbo | Fast version of Stable Diffusion XL |

## Getting Started

### Step 1: Obtain a Lilypad API Key

1. Visit the [Anura API Dashboard](https://anura.lilypad.tech/)
2. Sign up for an account or log in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key for use in swissknife

### Step 2: Configure SwissKnife for Lilypad

You can configure your Lilypad API key in one of two ways:

1.  **Environment Variable (Recommended)**: Set either `LILYPAD_API_KEY` or `ANURA_API_KEY` in your terminal environment before launching SwissKnife. The application will automatically detect and use it.
    ```bash
    # Example for Linux/macOS
    export LILYPAD_API_KEY="your-key-here"
    # OR
    export ANURA_API_KEY="your-key-here"

    swissknife agent chat # SwissKnife will use the key from the environment
    ```
    *(For Windows, use `set LILYPAD_API_KEY=your-key-here`)*

2.  **Configuration Command**: Store the key securely (encrypted) in the SwissKnife configuration file using the `apikey` command:
    ```bash
    swissknife apikey add lilypad "your-key-here"
    ```
    You only need to do this once. SwissKnife will use the stored key in subsequent sessions. You can verify stored keys using `swissknife apikey list lilypad`.

### Step 3: Select a Model

You can select a Lilypad model when running commands using the `--model` flag. Use the provider prefix `lilypad/`.

```bash
# List available Lilypad models
swissknife model list --provider lilypad

# Example: Select llama3.1:8b for chat
swissknife agent chat --model lilypad/llama-3.1-8b-instruct
```
*(Note: Model IDs might differ slightly from the table above, use `model list` for exact IDs)*.

### Step 4: Start Using the Model

Use the standard SwissKnife commands, specifying a Lilypad model ID with the `--model` flag.

- **Text Generation (Chat):**
  ```bash
  swissknife agent chat --model lilypad/llama-3.1-8b-instruct
  ```
  Then enter your prompts interactively.

- **Text Generation (Single Prompt):**
  ```bash
  swissknife agent execute "Write a poem about IPFS" --model lilypad/mistral-7b-instruct-v0.3
  ```

- **Image Generation (Conceptual):**
  *(Assuming an `image generate` command exists)*
  ```bash
  swissknife image generate "A robot coding in a neon-lit room" --model lilypad/stable-diffusion-xl-1024-v1-0
  ```

## Advanced Usage

### Using Function Calling

Some Lilypad models support function calling, which allows the model to request specific information or perform actions:

1. Define functions in the function editor
2. Submit a prompt that might require the defined function
3. The model will call the function when appropriate

Example function definition:

```json
{
  "name": "get_weather",
  "description": "Get current weather in a location",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City and state, e.g. San Francisco, CA"
      }
    },
    "required": ["location"]
  }
}
```

### Environment Variables

As mentioned in Step 2, you can configure the API key using environment variables instead of the `apikey add` command. SwissKnife checks these in order:

1.  `LILYPAD_API_KEY`
2.  `ANURA_API_KEY` (Lilypad's official variable name)

If either is set, it will be used (and potentially saved to the config file if not already present).

## Tips for Best Results

### Text Generation

- **Be specific in your prompts**: Clear, detailed prompts yield better results
- **Use system messages**: Set the tone and context with system messages
- **Adjust temperature**: Higher values (0.7-1.0) for more creative responses, lower values (0.1-0.3) for more deterministic responses
- **Multi-turn conversations**: Build on previous messages for context-aware responses

### Image Generation

- **Be descriptive**: Include details about style, lighting, composition, etc.
- **Specify art styles**: Mention specific styles like "photorealistic," "watercolor," "digital art," etc.
- **Use adjectives**: Descriptive adjectives help refine the generated image
- **Try variations**: Generate multiple images with slight prompt modifications to find the best result

## Troubleshooting

### Common Issues and Solutions

#### "Invalid API key" Error
- Verify your API key is correct and has not expired
- Generate a new key if necessary from the Anura dashboard
- Ensure there are no extra spaces or characters in your key

#### Models Not Loading
- Confirm your internet connection is stable
- Verify your API key has the necessary permissions
- Check if the Anura API is experiencing any outages

#### Slow Response Times
- Larger models may take longer to generate responses
- Complex prompts require more processing time
- Try a smaller model for faster responses

#### Function Calling Not Working
- Ensure you're using a model that supports function calling
- Verify your function definitions follow the correct format
- Make sure your prompt is relevant to the defined functions

## Privacy and Data Usage

- Your prompts and generated content are processed by Lilypad's Anura API according to their terms and privacy policy.
- API keys configured via `apikey add` are stored locally (and encrypted). Keys set via environment variables are read from the environment at runtime. SwissKnife itself does not send your keys to any central server other than the intended provider API endpoint (Lilypad).
- Refer to Lilypad's privacy policy for details on their data handling.

## Resources

- [Lilypad Documentation](https://docs.lilypad.tech/)
- [Anura API Dashboard](https://anura.lilypad.tech/)
- [SwissKnife Getting Started Guide](./GETTING_STARTED.md)
- [SwissKnife CLI Guide](./CLI_GUIDE.md)

## Feedback and Support

If you encounter any issues or have suggestions for improving the Lilypad integration, please:

1. Check the troubleshooting section in this guide
2. Refer to the full documentation for more details
3. Submit an issue on the swissknife GitHub repository
4. Contact Lilypad support for API-specific issues
