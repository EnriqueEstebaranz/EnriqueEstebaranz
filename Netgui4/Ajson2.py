import re
import json

# Nombre del archivo de entrada
input_filename = "packages.nkp"

with open(input_filename, "r") as file:
    packages_text = file.read()

# Inicializa una lista vacía para almacenar los paquetes
packages = []

# Expresión regular para extraer el tiempo y la ruta de cada línea
pattern = re.compile(r'time\((\d+\.\d+)\); route\(([^)]+)\)')

# Buscar coincidencias en el texto del archivo
matches = pattern.findall(packages_text)

# Recorrer las coincidencias y construir los paquetes
for match in matches:
    time = float(match[0])
    # Extraer los nodos separados por comas y eliminar espacios y comillas adicionales
    route = [node.strip().strip('"') for node in match[1].split(',')]
    package_info = {"time": time, "route": route}
    packages.append(package_info)

# Contiene el diccionario de datos
data = {"packages": packages}

# Cambiar el nombre del archivo, reemplazando la extensión .nkp por .json
output_filename = input_filename.replace(".nkp", ".json")

# "w" -> write, para escribir el archivo .json
with open(output_filename, "w") as json_file:
    # Convertir a formato JSON y escribir en el archivo con 2 espacios de indentación
    json.dump(data, json_file, indent=2)

print(f"El archivo JSON se ha creado correctamente: {output_filename}")
