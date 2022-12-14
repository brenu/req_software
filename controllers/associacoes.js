const bd = require('../config/bd');

class AssociacoesController {
    static async create(req, res) {
        try {
            const {id_projeto} = req.params;
            const {requisito, condicao, tipo} = req.body;

            if (requisito === condicao) {
                const requisitos = (await bd.query(`
                    SELECT 
                    requisitos_de_usuario.descritivo,
                    requisitos_de_usuario.id_projeto,
                    requisitos_de_usuario.id AS id_requisito_usuario,
                    requisitos_funcionais.id AS id_requisito_funcional
                    FROM requisitos_de_usuario
                    INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
                    WHERE requisitos_de_usuario.id_projeto = $1
                `, [id_projeto])).rows;

                return res.render('pages/associacoes_form', {
                    type: "create",
                    erro: "Os dois requisitos não podem ser iguais!",
                    requisitos
                });
            }

            await bd.query("INSERT INTO associacoes (id_requisito,id_condicao,tipo) VALUES ($1,$2,$3)", [requisito, condicao, tipo]);

            return res.redirect("/associacoes/"+id_projeto);
        } catch (error) {
            console.log(error);
                const requisitos = (await bd.query(`
                SELECT 
                requisitos_de_usuario.descritivo,
                requisitos_de_usuario.id_projeto,
                requisitos_de_usuario.id AS id_requisito_usuario,
                requisitos_funcionais.id AS id_requisito_funcional
                FROM requisitos_de_usuario
                INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
                WHERE requisitos_de_usuario.id_projeto = $1
            `, [id_projeto])).rows;


            return res.render('pages/associacoes_form', {
                type: "create",
                erro: "Associação inválida, tente novamente!",
                requisitos
            });
        }
    }

    static async delete(req, res) {
        const { id, id_projeto } = req.params;

        try {
            await bd.query(`
                DELETE FROM associacoes
                WHERE associacoes.id = $1 AND associacoes.id IN (
                    SELECT associacoes.id FROM requisitos_de_usuario
                    INNER JOIN requisitos_funcionais ON requisitos_funcionais.id_requisito_usuario = requisitos_de_usuario.id
                    INNER JOIN associacoes ON associacoes.id_requisito = requisitos_funcionais.id
                    WHERE associacoes.id = $1 AND requisitos_de_usuario.id_projeto = $2
                );
            `, [id, id_projeto]);

            return res.redirect("/associacoes/"+id_projeto);
        } catch (error) {
            console.log(error);

            return res.render("pages/404");
        }
    }
}

module.exports = AssociacoesController;