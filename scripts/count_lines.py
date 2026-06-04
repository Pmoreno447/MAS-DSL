"""
count_lines.py — Métricas de líneas para un modelo y su código generado.

Uso:
    python3.12 scripts/count_lines.py <ruta_carpeta_generada>

Ejemplo:
    python3.12 scripts/count_lines.py examples/03-casosDeUso/incidentResponder/generated

El script espera encontrar model.mad en el directorio padre de la carpeta generada.
"""

import re
import sys
from pathlib import Path

SKIP_DIRS = {"venv", "__pycache__", "node_modules"}
GENERATED_EXTENSIONS = {".py", ".json", ".txt"}


def is_excluded(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def count_generated(generated_dir: Path) -> tuple[int, list[tuple[int, str]]]:
    """Cuenta líneas en la carpeta generada, excluyendo prompt.py y venv."""
    total = 0
    files: list[tuple[int, str]] = []
    for f in generated_dir.rglob("*"):
        if not f.is_file() or is_excluded(f):
            continue
        if f.name == "prompt.py":
            continue
        if f.suffix in GENERATED_EXTENSIONS or f.name == ".env.template":
            n = len(f.read_text(errors="ignore").splitlines())
            total += n
            files.append((n, str(f.relative_to(generated_dir))))
    return total, sorted(files, reverse=True)


def count_mad(mad_file: Path) -> tuple[int, int]:
    """
    Cuenta líneas estructurales y de prompt en un model.mad.
    Los bloques de prompt son el texto dentro de 'profile X description "..."'.
    """
    structural = 0
    prompt = 0
    lines = mad_file.read_text(errors="ignore").splitlines()
    inside_prompt = False
    quote_count = 0
    for line in lines:
        stripped = line.strip()
        if not inside_prompt:
            if re.match(r"profile\s+\w+\s+description", stripped):
                inside_prompt = True
                structural += 1  # la cabecera del profile es DSL
                continue
            structural += 1
        else:
            quote_count += stripped.count('"')
            prompt += 1
            if stripped == '"' and quote_count >= 2:
                inside_prompt = False
                quote_count = 0
    return structural, prompt


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python3.12 scripts/count_lines.py <ruta_carpeta_generada>")
        sys.exit(1)

    generated_dir = Path(sys.argv[1]).resolve()
    if not generated_dir.is_dir():
        print(f"Error: '{generated_dir}' no es un directorio.")
        sys.exit(1)

    mad_file = generated_dir.parent / "model.mad"
    if not mad_file.exists():
        print(f"Aviso: no se encontró model.mad en '{generated_dir.parent}'")
        mad_file = None

    gen_total, gen_files = count_generated(generated_dir)
    mad_structural, mad_prompt = (count_mad(mad_file) if mad_file else (0, 0))
    mad_total = mad_structural + mad_prompt

    print("=" * 60)
    print(f"  {generated_dir.parent.name}")
    print("=" * 60)

    print("\n── CÓDIGO GENERADO (sin prompt.py) ──────────────────────")
    print(f"  Total líneas:  {gen_total}")
    for n, name in gen_files:
        print(f"  {n:>5}  {name}")

    if mad_file:
        print("\n── MODEL.MAD ────────────────────────────────────────────")
        print(f"  DSL estructural (sin prompts):  {mad_structural:>4}")
        print(f"  Texto de prompts:               {mad_prompt:>4}")
        print(f"  Total .mad:                     {mad_total:>4}")

        print("\n── RATIO ────────────────────────────────────────────────")
        if mad_structural > 0:
            print(f"  Generado / DSL estructural:  {gen_total / mad_structural:.1f}x")
        if mad_total > 0:
            print(f"  Generado / .mad completo:    {gen_total / mad_total:.1f}x")

    print("=" * 60)


if __name__ == "__main__":
    main()
