from transformers import AutoTokenizer, AutoModelForCausalLM

# Load the tokenizer and model
print("Loading Qwen-1.7B model...")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")

print("Model loaded successfully!")

# Prepare the messages
messages = [
    {"role": "user", "content": "Who are you?"},
]

# Apply chat template and prepare inputs
inputs = tokenizer.apply_chat_template(
    messages,
    add_generation_prompt=True,
    tokenize=True,
    return_dict=True,
    return_tensors="pt",
).to(model.device)

# Generate response
print("\nGenerating response...")
outputs = model.generate(**inputs, max_new_tokens=40)

# Decode and print the response
response = tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:])
print("\nResponse:")
print(response)
