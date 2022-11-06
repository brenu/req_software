const bd = require('../config/bd');

class AssociacoesViewsController {
    static async index(req, res) {
        const associacoes = (await bd.query(`
            SELECT 
            associacoes.id,
            associacoes.id_requisito,
            associacoes.id_condicao,
            associacoes.tipo
            FROM associacoes
            INNER JOIN requisitos_funcionais AS f1 ON associacoes.id_requisito = f1.id
            INNER JOIN requisitos_de_usuario ON requisitos_de_usuario.id = f1.id_requisito_usuario
            WHERE requisitos_de_usuario.id_usuario = $1
        `, [req.session.user.id])).rows;

        const requisitos = (await bd.query(`
            SELECT 
            requisitos_de_usuario.descritivo,
            requisitos_de_usuario.id_usuario,
            requisitos_de_usuario.id AS id_requisito_usuario,
            requisitos_funcionais.id AS id_requisito_funcional
            FROM requisitos_de_usuario
            INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
            WHERE requisitos_de_usuario.id_usuario = $1
        `, [req.session.user.id])).rows;

        for (let i=0; i<associacoes.length; i++) {

            requisitos.map((requisito, index) => {

                if (requisito.id_requisito_funcional === associacoes[i].id_requisito) {
                    associacoes[i].codigo_requisito = `RF-${index+1}`;
                } else if (requisito.id_requisito_funcional === associacoes[i].id_condicao) {
                    associacoes[i].codigo_condicao = `RF-${index+1}`;
                }

            });

        }

        return res.render('pages/associacoes', {
            associacoes: associacoes,
          });
    }

    static async create(req, res) {
        const requisitos = (await bd.query(`
            SELECT 
            requisitos_de_usuario.descritivo,
            requisitos_de_usuario.id_usuario,
            requisitos_de_usuario.id AS id_requisito_usuario,
            requisitos_funcionais.id AS id_requisito_funcional
            FROM requisitos_de_usuario
            INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
            WHERE requisitos_de_usuario.id_usuario = $1
        `, [req.session.user.id])).rows;

        return res.render('pages/associacoes_form', {
            type: "create",
            erro: "",
            requisitos
        });
    }

    static async edit(req, res) {
        const { id } = req.params;

        try {
            const texto = (await bd.query("SELECT descritivo FROM requisitos_de_usuario WHERE id = $1 AND id_usuario = $2",
            [id, req.session.user.id])).rows[0].descritivo;

            if (texto) {
            return res.render('pages/requirement_form', {
                type: "edit",
                texto,
                erro: "",
            });
            }
        } catch (error) {
            return res.render("pages/404");
        }
    }
}

module.exports = AssociacoesViewsController;