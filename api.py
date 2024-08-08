from flask import Flask, jsonify, request
import cx_Oracle
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from flask_cors import CORS

app = Flask(__name__)

CORS(app)


# Configuração da conexão com o banco de dados
dsn = cx_Oracle.makedsn("localhost", 1521, service_name="xepdb1")
connection = cx_Oracle.connect(user="sys", password="123456", dsn=dsn, mode=cx_Oracle.SYSDBA)

@app.route('/clientes', methods=['GET'])
def get_clientes():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT * FROM clientes")
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        
        # Converte os dados em formato JSON
        result = [dict(zip(columns, row)) for row in rows]
        return jsonify(result)
    except cx_Oracle.DatabaseError as e:
        error, = e.args
        return jsonify({"error": "Database error", "message": error.message}), 500
    finally:
        cursor.close()

@app.route('/clientes/<int:id>', methods=['GET'])
def get_cliente(id):
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT * FROM clientes WHERE id_cliente = :id", {'id': id})
        row = cursor.fetchone()
        if row:
            columns = [desc[0] for desc in cursor.description]
            result = dict(zip(columns, row))
            return jsonify(result)
        else:
            return jsonify({"error": "Cliente não encontrado"}), 404
    except cx_Oracle.DatabaseError as e:
        error, = e.args
        return jsonify({"error": "Database error", "message": error.message}), 500
    finally:
        cursor.close()

@app.route('/adicionar', methods=['POST'])
def adicionar():
    cursor = connection.cursor()
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Nenhum dado foi enviado. Verifique o formato da requisição."}), 400

        if isinstance(data, dict):
            data = [data]

        for cliente in data:
            id_cliente = cliente.get('id_cliente')
            nome_cliente = cliente.get('nome_cliente')
            sexo = cliente.get('sexo')
            email = cliente.get('email')
            data_nascimento_str = cliente.get('data_nascimento')

            if not all([id_cliente, nome_cliente, sexo, email, data_nascimento_str]):
                return jsonify({"error": "Todos os campos são obrigatórios."}), 400

            try:
                data_nascimento = datetime.strptime(data_nascimento_str, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Formato de data inválido. Utilize o formato 'YYYY-MM-DD'."}), 400

            comando_insercao = """INSERT INTO clientes (id_cliente, nome_cliente, sexo, email, data_nascimento)
                                  VALUES (:id_cliente, :nome_cliente, :sexo, :email, :data_nascimento)"""
            valores = {
                'id_cliente': id_cliente,
                'nome_cliente': nome_cliente,
                'sexo': sexo,
                'email': email,
                'data_nascimento': data_nascimento
            }
            cursor.execute(comando_insercao, valores)
            connection.commit()

        return jsonify({"message": "Clientes adicionados com sucesso!"}), 201
    except cx_Oracle.DatabaseError as e:
        error, = e.args
        return jsonify({"error": "Database error", "message": error.message}), 409
    finally:
        cursor.close()

@app.route('/deletar/<int:id_cliente>', methods=['DELETE'])
def deletar(id_cliente):
    cursor = connection.cursor()
    try:
        comando_delecao = "DELETE FROM clientes WHERE id_cliente = :id_cliente"
        cursor.execute(comando_delecao, {'id_cliente': id_cliente})
        connection.commit()

        return jsonify({"message": "Cliente deletado com sucesso!"}), 200
    except cx_Oracle.DatabaseError as e:
        error, = e.args
        return jsonify({"error": "Database error", "message": error.message}), 500
    finally:
        cursor.close()
    
@app.route('/atualizar/<int:id_cliente>', methods=['PUT'])
def atualizar(id_cliente):
    cursor = connection.cursor()
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Nenhum dado foi enviado. Verifique o formato da requisição."}), 400

        nome_cliente = data.get('nome_cliente')
        sexo = data.get('sexo')
        email = data.get('email')
        data_nascimento_str = data.get('data_nascimento')

        if not any([nome_cliente, sexo, email, data_nascimento_str]):
            return jsonify({"error": "Pelo menos um campo deve ser atualizado."}), 400

        try:
            if data_nascimento_str:
                data_nascimento = datetime.strptime(data_nascimento_str, "%Y-%m-%d").date()
            else:
                data_nascimento = None
        except ValueError:
            return jsonify({"error": "Formato de data inválido. Utilize o formato 'YYYY-MM-DD'."}), 400

        set_clause = []
        values = {'id_cliente': id_cliente}

        if nome_cliente:
            set_clause.append("nome_cliente = :nome_cliente")
            values['nome_cliente'] = nome_cliente
        if sexo:
            set_clause.append("sexo = :sexo")
            values['sexo'] = sexo
        if email:
            set_clause.append("email = :email")
            values['email'] = email
        if data_nascimento_str:
            set_clause.append("data_nascimento = :data_nascimento")
            values['data_nascimento'] = data_nascimento

        set_clause = ", ".join(set_clause)
        comando_atualizacao = f"UPDATE clientes SET {set_clause} WHERE id_cliente = :id_cliente"
        cursor.execute(comando_atualizacao, values)
        connection.commit()

        return jsonify({"message": "Cliente atualizado com sucesso!"}), 200

    except cx_Oracle.DatabaseError as e:
        error, = e.args
        return jsonify({"error": "Database error", "message": error.message}), 500
    finally:
        cursor.close()

if __name__ == "__main__":
    app.run(debug=True)
