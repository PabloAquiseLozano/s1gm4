"""
prompt_loader.py — Carga y entrega los system prompts de S1GM4.

Los prompts viven como archivos Markdown en la carpeta `../prompts/`.
Si un archivo .md no existe, se cae al default embebido.
"""
import os

_PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")

# ── Defaults embebidos (fallback por si los .md no existen) ────────────────
_DEFAULTS: dict[str, str] = {
    "reflexive": (
        "Eres S1GM4 en modo Reflexivo: un mentor estoico empático y estructurado.\n"
        "Responde SIEMPRE en el idioma del usuario.\n"
        "NO muestres razonamiento interno ni bloques de pensamiento. "
        "Escribe directamente tu respuesta final."
    ),
    "aggressive": (
        "Eres S1GM4 en Modo Bestia: un entrenador implacable estilo David Goggins.\n"
        "Responde SIEMPRE en el idioma del usuario.\n"
        "NO muestres razonamiento interno ni bloques de pensamiento. "
        "Escribe directamente tu respuesta final."
    ),
}


def _load_md(mode: str) -> str | None:
    """Carga el prompt desde el archivo Markdown correspondiente."""
    path = os.path.join(_PROMPTS_DIR, f"{mode}.md")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def get_prompt(mode: str, override: str | None = None) -> str:
    """
    Retorna el system prompt para el modo dado.

    Prioridad:
    1. `override` — si el cliente envía un prompt propio
    2. Archivo `prompts/<mode>.md`
    3. Default embebido en este módulo
    """
    if override:
        return override
    return _load_md(mode) or _DEFAULTS.get(mode, _DEFAULTS["reflexive"])
