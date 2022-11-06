const sqlStatements = {
    "exibir": "SELECT * FROM ",
    "incluir": "INSERT INTO"
}

class Requisito {
    constructor(texto) {
        this.texto = texto;
        
        this.tipo;
        this.tipo_requisito;
        this.entidade;
        this.condicao;
        this.atributos = [];
        
        const error = this.parse(this.texto);
        if (error) {
            throw error;
        }
    }

    parse(texto) {
        // Removendo "o sistema deve (...)"
        texto = texto.toLowerCase().replace("o sistema deve ", "");

        // Removendo espaços desnecessários
        texto = texto.replace("  ", " ").replace(", ", ",").replace(" ,", ",");

        // Separando o requisito em partes
        const splittedTexto = texto.split(" ");

        // Verificando a sintaxe
        if (splittedTexto[0] === "incluir" && (splittedTexto.length < 4 || splittedTexto[splittedTexto.length-2] !== "com" )) {
            return "O requisito não segue a sintaxe esperada. Por favor, revise!";  
        }

        this.tipo = splittedTexto[0];
        this.tipo_requisito = ["exibir", "incluir", "atualizar", "remover"].includes(this.tipo) ? "crud" : "processamento";
        this.entidade = splittedTexto[1];

        if (this.tipo_requisito === "crud") {
            if (this.tipo === "incluir") {
                // Removendo caracteres indesejados dos atributos
                splittedTexto[splittedTexto.length-1] = splittedTexto[splittedTexto.length-1].replace(/[^\w\,]/g, "");
                
                this.atributos = splittedTexto[splittedTexto.length-1].split(",");
            }

            if (splittedTexto[2] !== "com") {
                this.condicao = splittedTexto[2];
            }
        }
    }  

    getSQL() {
        if (this.tipo_requisito !== "crud") {
            return "N/A";
        }

        let resultado = "";

        switch(this.tipo) {
            case "exibir":
                resultado = `SELECT * FROM ${this.entidade}`;
                break;
            case "incluir":
                resultado = `INSERT INTO ${this.entidade} (${this.atributos.join(",")}) VALUES (...)`;
                break;
            case "atualizar":
                resultado = `UPDATE ${this.entidade} SET ... WHERE ...`;
                break;
            case "remover":
                resultado = `DELETE FROM ${this.entidade} WHERE ...`;
                break;
            default:
                resultado = "N/A";
        }

        return resultado;

    }
}

module.exports = Requisito;