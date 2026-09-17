from fastapi import FastAPI

# FastAPI App එක හදමු
app = FastAPI(title="Dummy Notes API")

@app.get("/")
def read_root():
    return {"message": "Hello SmartAgri! Backend is working."}
