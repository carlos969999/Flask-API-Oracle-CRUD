// Simula um banco de dados em memória
var clientes = [];

// Guarda o objeto que está sendo alterado
var clienteAlterado = null;

function adicionar() {
	// Libera para digitar o ID do Cliente
	document.getElementById("id_cliente").disabled = false;
	clienteAlterado = null;
	mostrarModal();
	limparForm();
}

function alterar(id_cliente) {
	// Procurar o cliente que tem o ID clicado no alterar
	for (let i = 0; i < clientes.length; i++) {
		let cliente = clientes[i];
		if (cliente.ID_CLIENTE == id_cliente) {
			// Achou o cliente, então preenche o form
			document.getElementById("id_cliente").value = cliente.ID_CLIENTE;
			document.getElementById("nome_cliente").value = cliente.NOME_CLIENTE;
			document.getElementById("sexo").value = cliente.SEXO;
			document.getElementById("email").value = cliente.EMAIL;

			// Supondo que cliente.DATA_NASCIMENTO é uma string no formato 'Sat, 11 Nov 1111 00:00:00 GMT'
			let dataNascimento = new Date(cliente.DATA_NASCIMENTO);

			// Função para formatar a data como yyyy-mm-dd
			function formatDateForInput(date) {
				let ano = date.getFullYear();
				let mes = String(date.getMonth() + 1).padStart(2, "0"); // Meses são indexados a partir de 0
				let dia = String(date.getDate() + 1).padStart(2, "0");
				return `${ano}-${mes}-${dia}`;
			}

			// Aplicar a formatação e definir o valor do input
			document.getElementById("data_nascimento").value =
				formatDateForInput(dataNascimento);

			clienteAlterado = cliente;
		}
	}
	// Bloquear o ID do cliente para não permitir alterá-lo
	document.getElementById("id_cliente").disabled = true;
	mostrarModal();
}

function excluir(id_cliente) {
	if (confirm("Você deseja realmente excluir?")) {
		fetch("http://127.0.0.1:5000/deletar/" + id_cliente, {
			headers: {
				"Content-type": "application/json",
			},
			method: "DELETE",
		})
			.then(() => {
				// Após terminar de excluir, recarrega a lista de clientes
				recarregarClientes();
				alert("Cliente excluído com sucesso");
			})
			.catch((error) => {
				console.log(error);
				alert("Não foi possível excluir o cliente");
			});

		exibirDados();
	}
}

function mostrarModal() {
	let containerModal = document.getElementById("container-modal");
	containerModal.style.display = "flex";
}

function ocultarModal() {
	let containerModal = document.getElementById("container-modal");
	containerModal.style.display = "none";
}

function cancelar() {
	ocultarModal();
	limparForm();
}

function salvar() {
	let id_cliente = document.getElementById("id_cliente").value;
	let nome_cliente = document.getElementById("nome_cliente").value;
	let sexo = document.getElementById("sexo").value;
	let email = document.getElementById("email").value;
	let data_nascimento = document.getElementById("data_nascimento").value;

	console.log(id_cliente, nome_cliente, sexo, email, data_nascimento);

	if (clienteAlterado == null) {
		let cliente = {
			id_cliente: id_cliente,
			nome_cliente: nome_cliente,
			sexo: sexo,
			email: email,
			data_nascimento: data_nascimento,
		};
		// Salva o cliente no back-end
		fetch("http://127.0.0.1:5000/adicionar", {
			headers: {
				"Content-type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(cliente),
		})
			.then((response) => {
				if (response.ok) {
					clienteAlterado = null;
					limparForm();
					ocultarModal();
					recarregarClientes();
					alert("Cliente cadastrado com sucesso!");
				} else if (response.status === 409) {
					alert("O ID CLIENTE já existe. Por favor, insira um ID diferente.");
				} else if (response.status === 400) {
					alert("Por favor, preencha o formulário corretamente.");
				} else {
					alert("Ops... algo deu errado!");
				}
			})
			.catch(() => {
				alert("Ops... algo deu errado!");
			});
	} else {
		// Verifica se todos os campos estão preenchidos
		if (!id_cliente || !nome_cliente || !sexo || !email || !data_nascimento) {
			alert("Todos os campos devem ser preenchidos corretamente.");
			return; // Interrompe a execução do código se algum campo estiver vazio
		}
		clienteAlterado.id_cliente = id_cliente;
		clienteAlterado.nome_cliente = nome_cliente;
		clienteAlterado.sexo = sexo;
		clienteAlterado.email = email;
		clienteAlterado.data_nascimento = data_nascimento;

		fetch(`http://127.0.0.1:5000/atualizar/${clienteAlterado.id_cliente}`, {
			headers: {
				"Content-type": "application/json",
			},
			method: "PUT",
			body: JSON.stringify(clienteAlterado),
		})
			.then(() => {
				clienteAlterado = null;
				limparForm();
				ocultarModal();
				recarregarClientes();
				alert("Cliente Alterado com sucesso!");
			})
			.catch((error) => {
				alert("Não foi possível alterar o cliente");
			});
	}
}

function exibirDados() {
	let tbody = document.querySelector("#table-customers tbody");
	tbody.innerHTML = "";

	//formatar a data
	function formatDate(dateString) {
		const date = new Date(dateString);
		const day = String(date.getDate() + 1).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Meses são baseados em zero
		const year = date.getFullYear();

		return `${day}/${month}/${year}`;
	}
	// Ordenar clientes por ID_CLIENTE
	clientes.sort((a, b) => a.ID_CLIENTE - b.ID_CLIENTE);

	for (let i = 0; i < clientes.length; i++) {
		let linha = `
        <tr>
            <td>${clientes[i].ID_CLIENTE}</td>
            <td>${clientes[i].NOME_CLIENTE}</td>
            <td>${clientes[i].SEXO}</td>
            <td>${clientes[i].EMAIL}</td>
            <td>${formatDate(clientes[i].DATA_NASCIMENTO)}</td>
            <td>
                <button onclick="alterar('${clientes[i].ID_CLIENTE}')">Alterar</button>
                <button onclick="excluir('${clientes[i].ID_CLIENTE}')" class="botao-excluir">Excluir</button>
            </td>
        </tr>`;
		tbody.innerHTML += linha;
	}
}

function limparForm() {
	document.getElementById("id_cliente").value = "";
	document.getElementById("nome_cliente").value = "";
	document.getElementById("sexo").value = "";
	document.getElementById("email").value = "";
	document.getElementById("data_nascimento").value = "";
}

function recarregarClientes() {
	fetch("http://127.0.0.1:5000/clientes", {
		headers: {
			"Content-type": "application/json",
		},
		method: "GET",
	})
		.then((response) => response.json())
		.then((response) => {
			console.log(response);
			clientes = response;
			exibirDados();
		})
		.catch(() => {
			alert("Erro ao listar os clientes");
		});
}
