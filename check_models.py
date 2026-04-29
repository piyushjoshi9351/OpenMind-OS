import google.generativeai as genai

api_key = "AIzaSyAmlv8d0D4FHxqSsalr7kipujkxpWosKEg"
genai.configure(api_key=api_key)

print("Available models for generateContent:")
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"✓ {model.name}")
