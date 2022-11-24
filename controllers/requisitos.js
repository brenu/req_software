const Requisito = require('../models/requisito');
const bd = require('../config/bd');

const crudOperations = {
    "incluir": "C",
    "exibir": "R",
    "atualizar": "U",
    "remover": "D"
};

const getSetOperations = {
    "C": "set",
    "R": "get",
    "U": "get,set",
    "D": "get,set",
    "N/A": "N/A"
}

class RequisitosController {
    static async index(req, res) {
        const {id_projeto} = req.params;

        const requisitosDeCRUD = (await bd.query(`
            SELECT 
            requisitos_de_usuario.descritivo,
            requisitos_de_usuario.id_projeto,
            requisitos_de_usuario.id AS id_requisito_usuario,
            requisitos_funcionais.id AS id_requisito_funcional,
            'crud' AS tipo,
            entidades.nome AS entidade
            FROM requisitos_de_usuario
            INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
            INNER JOIN requisitos_de_crud ON requisitos_funcionais.id = requisitos_de_crud.id_requisito_funcional
            INNER JOIN entidades ON entidades.id_requisito_de_crud = requisitos_de_crud.id
            WHERE requisitos_de_usuario.id_projeto = $1
        `, [id_projeto])).rows;

        const requisitosDeProcessamento = (await bd.query(`
            SELECT 
            requisitos_de_usuario.descritivo,
            requisitos_de_usuario.id_projeto,
            requisitos_de_usuario.id AS id_requisito_usuario,
            requisitos_funcionais.id AS id_requisito_funcional,
            'processamento' AS tipo,
            'N/A' AS entidade
            FROM requisitos_de_usuario
            INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
            INNER JOIN requisitos_de_processamento ON requisitos_funcionais.id = requisitos_de_processamento.id_requisito_funcional
            WHERE requisitos_de_usuario.id_projeto = $1
        `, [id_projeto])).rows;

        const associacoes = (await bd.query(`
            SELECT 
            associacoes.id,
            associacoes.id_requisito,
            associacoes.id_condicao,
            associacoes.tipo
            FROM associacoes
            INNER JOIN requisitos_funcionais AS f1 ON associacoes.id_requisito = f1.id
            INNER JOIN requisitos_de_usuario ON requisitos_de_usuario.id = f1.id_requisito_usuario
            WHERE requisitos_de_usuario.id_projeto = $1
        `, [id_projeto])).rows;

        let requisitos = [...requisitosDeCRUD, ...requisitosDeProcessamento];
        requisitos = await Promise.all(requisitos.map(async (requisito, indice) => {
            const requisitoProcessado = new Requisito(requisito.descritivo);

            requisito.crud = requisito.tipo === "crud" ? crudOperations[requisitoProcessado["tipo"]] : "N/A";
            requisito.getSet = getSetOperations[requisito.crud];
            requisito.sql = requisitoProcessado.getSQL();
            requisito.casoDeUso = requisitoProcessado.tipo_requisito === "crud" ? `${requisitoProcessado.tipo} ${requisitoProcessado.entidade}` : requisitoProcessado.resto;
            requisito.identificador = `RF-${indice+1}`;

            if (requisitoProcessado.atributos.length) {
                requisito.atributos = requisitoProcessado.atributos.join(",");
            } else {
                requisito.atributos = "N/A";
            }

            if (!associacoes || associacoes.length == 0) {
                requisito.condicoes = "*";
            } else {
                requisito.condicoes = "";

                for (let i=0; i<associacoes.length; i++) {
        
                    if (requisito.id_requisito_funcional === associacoes[i].id_requisito) {
                        requisito.condicoes += `${associacoes[i].tipo}(RF-${requisitos.findIndex((item) => item.id_requisito_funcional == associacoes[i].id_condicao)+1})\n`;;
                    }
    
                }

                if (requisito.condicoes === "") {
                    requisito.condicoes = "*"
                }

            }

            return requisito;
        }));
        
        return res.render('pages/requirements', {
            requisitos,
            id_projeto
        });
    }

    static async create(req, res) {
        const {id_projeto} = req.params;
        let { texto } = req.body;

        try {
            const requisito = new Requisito(texto);

            const id_requisito_de_usuario = (await bd.query(
                "INSERT INTO requisitos_de_usuario (id_projeto, descritivo) VALUES ($1, $2) RETURNING id",
                [id_projeto, requisito.texto]
            )).rows[0].id;

            const id_requisito_funcional = (await bd.query(
                "INSERT INTO requisitos_funcionais (id_requisito_usuario) VALUES ($1) RETURNING id",
                [id_requisito_de_usuario]
            )).rows[0].id;
        
            if (requisito.tipo_requisito === "crud") {
                const id_requisito_de_crud = (await bd.query(
                    "INSERT INTO requisitos_de_crud (id_requisito_funcional, tipo) VALUES ($1, $2) RETURNING id",
                    [id_requisito_funcional, requisito.tipo]
                )).rows[0].id;

                const id_entidade = (await bd.query(
                    "INSERT INTO entidades (id_requisito_de_crud, nome) VALUES ($1, $2) RETURNING id",
                    [id_requisito_de_crud, requisito.entidade]
                )).rows[0].id;

                for (let atributo of requisito.atributos) {
                    await bd.query(
                        "INSERT INTO atributos (id_entidade, nome, tipo, tamanho) VALUES ($1, $2, $3, $4) RETURNING id",
                        [id_entidade, atributo, "varchar", "255"]
                    );
                }
            } else {
                await bd.query(
                    "INSERT INTO requisitos_de_processamento (id_requisito_funcional) VALUES ($1)",
                    [id_requisito_funcional]
                );
            }

            return res.redirect(`/requirements/${id_projeto}`);
        } catch (error) {
            if (typeof error === "string") {
            return res.render('pages/requirement_form', {
                type: "create",
                erro: error,
            });
            }

            return res.render('pages/requirement_form', {
            type: "create",
            erro: "Houve um erro no processo, revise a estrutura do requisito inserido!",
            });
        }
    }

    static async edit(req, res) {
        const { id, id_projeto } = req.params;
        const { texto } = req.body;

        try {
            const id_requisito = (await bd.query("SELECT id FROM requisitos_de_usuario WHERE id  = $1 AND id_projeto = $2", [id, id_projeto])).rows[0].id;

            if (id_requisito) {
                await bd.query("DELETE FROM requisitos_funcionais WHERE id_requisito_usuario = $1", [id_requisito]);

                const requisito = new Requisito(texto);

                await bd.query("UPDATE requisitos_de_usuario SET descritivo = $1 WHERE id = $2", [requisito.texto, id_requisito]);

                const id_requisito_funcional = (await bd.query(
                    "INSERT INTO requisitos_funcionais (id_requisito_usuario) VALUES ($1) RETURNING id",
                    [id_requisito]
                )).rows[0].id;
                
                if (requisito.tipo_requisito === "crud") {
                    const id_requisito_de_crud = (await bd.query(
                        "INSERT INTO requisitos_de_crud (id_requisito_funcional, tipo) VALUES ($1, $2) RETURNING id",
                        [id_requisito_funcional, requisito.tipo]
                    )).rows[0].id;
            
                    const id_entidade = (await bd.query(
                        "INSERT INTO entidades (id_requisito_de_crud, nome) VALUES ($1, $2) RETURNING id",
                        [id_requisito_de_crud, requisito.entidade]
                    )).rows[0].id;
            
                    for (let atributo of requisito.atributos) {
                    await bd.query(
                        "INSERT INTO atributos (id_entidade, nome, tipo, tamanho) VALUES ($1, $2, $3, $4) RETURNING id",
                        [id_entidade, atributo, "varchar", "255"]
                    );
                    }
                } else {
                    await bd.query(
                        "INSERT INTO requisitos_de_processamento (id_requisito_funcional) VALUES ($1)",
                        [id_requisito_funcional]
                    );
                }

                return res.redirect("/requirements/"+id_projeto);
            }

            return res.render("pages/404");
        } catch (error) {
            console.log(error);
            return res.render("pages/404");
        }
    }

    static async delete(req, res) {
        const { id, id_projeto } = req.params;

        try {
            await bd.query("DELETE FROM requisitos_de_usuario WHERE id = $1 AND id_projeto = $2", [id, id_projeto]);

            return res.redirect("/requirements/"+id_projeto);
        } catch (error) {
            return res.render("pages/404");
        }
    }
}

module.exports = RequisitosController;