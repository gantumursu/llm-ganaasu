from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from pocketbase import PocketBase

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize PocketBase client
pb = PocketBase('http://127.0.0.1:8090')

# Load the Qwen model and tokenizer
print("Loading Qwen-1.5B model...")
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"CUDA device: {torch.cuda.get_device_name(0)}")
    print(f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    
    tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")
    model = AutoModelForCausalLM.from_pretrained(
        "Qwen/Qwen2.5-1.5B-Instruct",
        torch_dtype=torch.float16,
        device_map="cuda:0"
    )
    print(f"Model loaded successfully on GPU! Using device: {next(model.parameters()).device}")
else:
    print("CUDA not available, using CPU...")
    tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")
    model = AutoModelForCausalLM.from_pretrained(
        "Qwen/Qwen2.5-1.5B-Instruct",
        torch_dtype=torch.float32,
        device_map="cpu"
    )
    print(f"Model loaded successfully on CPU!")

def get_conversation_history(chat_id, max_messages=10):
    """Fetch conversation history from PocketBase"""
    try:
        messages = pb.collection('messages').get_full_list(
            query_params={
                'filter': f'chat_id = "{chat_id}"',
                'sort': '-created',
                'perPage': max_messages
            }
        )
        # Reverse to get chronological order
        messages.reverse()
        return messages
    except Exception as e:
        print(f"Error fetching conversation history: {e}")
        return []

def format_messages_for_model(history):
    """Convert PocketBase messages to Qwen chat format"""
    formatted_messages = []
    
    for msg in history:
        # Handle both object and dict access
        sender = getattr(msg, 'sender', None) or msg.get('sender') if isinstance(msg, dict) else msg.sender
        text = getattr(msg, 'text', None) or msg.get('text') if isinstance(msg, dict) else msg.text
        
        role = "user" if sender == "user" else "assistant"
        formatted_messages.append({
            "role": role,
            "content": text
        })
        print(f"  - {role}: {text[:50]}...")
    
    return formatted_messages

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model": "Qwen2.5-1.5B-Instruct",
        "device": str(model.device)
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate AI response with conversation history"""
    try:
        data = request.json
        user_message = data.get('message')
        chat_id = data.get('chat_id')
        max_history = data.get('max_history', 10)  # Number of previous messages to include
        
        if not user_message or not chat_id:
            return jsonify({"error": "Missing message or chat_id"}), 400
        
        # Get conversation history from PocketBase
        history = get_conversation_history(chat_id, max_history)
        
        # Format messages for the model
        messages = format_messages_for_model(history)
        
        # Add the new user message
        messages.append({"role": "user", "content": user_message})
        
        print(f"\n[Chat {chat_id}] Conversation history: {len(messages)} messages")
        
        # Apply chat template and prepare inputs
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(model.device)
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode only the new tokens (response)
        response = tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:],
            skip_special_tokens=True
        )
        
        print(f"[Chat {chat_id}] Generated response: {response[:100]}...")
        
        # Save the bot response to PocketBase
        try:
            bot_message = pb.collection('messages').create({
                'chat_id': chat_id,
                'text': response,
                'sender': 'bot'
            })
            print(f"[Chat {chat_id}] Bot message saved to PocketBase: {bot_message.id}")
        except Exception as e:
            print(f"[Chat {chat_id}] Error saving bot message to PocketBase: {e}")
            return jsonify({"error": f"Failed to save message: {str(e)}"}), 500
        
        return jsonify({
            "success": True,
            "message_id": bot_message.id,
            "chat_id": chat_id,
            "history_length": len(messages) - 1  # Excluding the current message
        })
        
    except Exception as e:
        print(f"Error generating response: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/reasoning', methods=['POST'])
def reasoning():
    """Generate reasoning/thinking process for a message"""
    try:
        data = request.json
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({"error": "Missing message"}), 400
        
        # Create a reasoning prompt
        reasoning_messages = [
            {
                "role": "system",
                "content": "Explain your reasoning process step-by-step for the following question."
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
        
        inputs = tokenizer.apply_chat_template(
            reasoning_messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(model.device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.5,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        reasoning_text = tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:],
            skip_special_tokens=True
        )
        
        return jsonify({"reasoning": reasoning_text})
        
    except Exception as e:
        print(f"Error generating reasoning: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🤖 Qwen AI Server Started")
    print("="*50)
    print(f"Model: Qwen2.5-1.5B-Instruct")
    print(f"Device: {model.device}")
    print(f"API: http://localhost:5000")
    print(f"PocketBase: http://127.0.0.1:8090")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
