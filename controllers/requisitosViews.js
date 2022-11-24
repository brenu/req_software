const bd = require('../config/bd');

class RequisitosViewsController {
    static async create(req, res) {
        const {id_projeto} = req.params;

        return res.render('pages/requirement_form', {
            type: "create",
            texto: "",
            erro: "",
            id_projeto
          });
    }

    static async edit(req, res) {
        const { id, id_projeto } = req.params;

        try {
            const texto = (await bd.query("SELECT descritivo FROM requisitos_de_usuario WHERE id = $1 AND id_projeto = $2",
            [id, id_projeto])).rows[0].descritivo;

            if (texto) {
            return res.render('pages/requirement_form', {
                type: "edit",
                texto,
                erro: "",
                id_projeto
            });
            }
        } catch (error) {
            return res.render("pages/404");
        }
    }
}

module.exports = RequisitosViewsController;