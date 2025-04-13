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

### Step 2: Configure swissknife for Lilypad

1. Launch swissknife
2. From the provider selection screen, select "Lilypad"
3. When prompted, enter your API key
4. Click "Continue" to proceed

### Step 3: Select a Model

1. From the models list, select the Lilypad model you wish to use
2. Text generation models are labeled with "chat" mode
3. Image generation models are labeled with "image" mode
4. You can filter models by type using the mode selector

### Step 4: Start Using the Model

- For text generation models:
  - Enter your prompt in the chat interface
  - Adjust parameters as needed (temperature, max tokens, etc.)
  - Send your message to receive a response

- For image generation models:
  - Enter a detailed description of the image you want to generate
  - Adjust parameters like image size or number of images
  - Click "Generate" to create your image

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

Instead of entering your API key each time, you can set environment variables:

- `LILYPAD_API_KEY`: Primary environment variable
- `ANURA_API_KEY`: Alternative environment variable (Lilypad's official name)

Example (Linux/macOS):
```bash
export LILYPAD_API_KEY=your_api_key_here
```

Example (Windows):
```cmd
set LILYPAD_API_KEY=your_api_key_here
```

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

- Your prompts and generated content are processed through Lilypad's Anura API
- API keys are stored locally and never sent to the swissknife servers
- Refer to Lilypad's privacy policy for information about data retention and usage

## Resources

- [Lilypad Documentation](https://docs.lilypad.tech/)
- [Anura API Dashboard](https://anura.lilypad.tech/)
- [swissknife Documentation](docs/GETTING_STARTED.md)

## Feedback and Support

If you encounter any issues or have suggestions for improving the Lilypad integration, please:

1. Check the troubleshooting section in this guide
2. Refer to the full documentation for more details
3. Submit an issue on the swissknife GitHub repository
4. Contact Lilypad support for API-specific issues
