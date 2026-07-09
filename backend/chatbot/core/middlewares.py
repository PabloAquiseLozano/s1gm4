from fastapi.middleware.cors import CORSMiddleware

def add_cors_middleware(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # En producción cambiar por ["http://localhost:5173", "tu-dominio.com"]
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
