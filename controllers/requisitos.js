const Requisito = require('../models/requisito');
const bd = require('../config/bd');

class RequisitosController {
    static async index(req, res) {
        const requisitosDeCRUD = (await bd.query(`
            SELECT 
            requisitos_de_usuario.descritivo,
            requisitos_de_usuario.id_usuario,
            requisitos_de_usuario.id AS id_requisito_usuario,
            'crud' AS tipo,
            entidades.nome AS entidade
            FROM requisitos_de_usuario
            INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
            INNER JOIN requisitos_de_crud ON requisitos_funcionais.id = requisitos_de_crud.id_requisito_funcional
            INNER JOIN entidades ON entidades.id_requisito_de_crud = requisitos_de_crud.id
            WHERE requisitos_de_usuario.id_usuario = $1
        `, [req.session.user.id])).rows;

        const requisitosDeProcessamento = (await bd.query(`
            SELECT 
            requisitos_de_usuario.descritivo,
            requisitos_de_usuario.id_usuario,
            requisitos_de_usuario.id AS id_requisito_usuario,
            'processamento' AS tipo,
            'N/A' AS entidade
            FROM requisitos_de_usuario
            INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
            INNER JOIN requisitos_de_processamento ON requisitos_funcionais.id = requisitos_de_processamento.id_requisito_funcional
            WHERE requisitos_de_usuario.id_usuario = $1
        `, [req.session.user.id])).rows;
        
        return res.render('pages/requirements', {
            requisitos: [...requisitosDeCRUD, ...requisitosDeProcessamento],
        });
    }

    static async create(req, res) {
        const { texto } = req.body;

        try {
            const requisito = new Requisito(texto);

            const id_requisito_de_usuario = (await bd.query(
                "INSERT INTO requisitos_de_usuario (id_usuario, descritivo) VALUES ($1, $2) RETURNING id",
                [req.session.user.id, requisito.texto]
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

            return res.redirect("/requirements");
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
        const { id } = req.params;
        const { texto } = req.body;

        try {
            const id_requisito = (await bd.query("SELECT id FROM requisitos_de_usuario WHERE id  = $1 AND id_usuario = $2", [id, req.session.user.id])).rows[0].id;

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

                return res.redirect("/requirements");
            }

            return res.render("pages/404");
        } catch (error) {
            console.log(error);
            return res.render("pages/404");
        }
    }

    static async delete(req, res) {
        const { id } = req.params;

        try {
            await bd.query("DELETE FROM requisitos_de_usuario WHERE id = $1 AND id_usuario = $2", [id, req.session.user.id]);

            return res.redirect("/requirements");
        } catch (error) {
            return res.render("pages/404");
        }
    }
}

module.exports = RequisitosController;