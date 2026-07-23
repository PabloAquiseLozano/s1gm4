from fastapi import FastAPI
from .core.middlewares import add_cors_middleware
from .routers import chat

app = FastAPI(title="S1GM4 Backend API")

# Middlewares
add_cors_middleware(app)

# Routers
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"status": "S1GM4 Backend is running!"}
