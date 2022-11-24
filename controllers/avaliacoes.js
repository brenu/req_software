const bd = require("../config/bd");

class AvaliacoesController {
    static async update(req, res) {
        const { id_projeto } = req.params;

        Object.keys(req.body).forEach(async key => {
            await bd.query("UPDATE questoes_avaliacao_projeto SET resposta = $1 WHERE id = $2", [req.body[key], key]);
        });

        return res.redirect("/avaliacao/"+id_projeto);
    }
}

module.exports = AvaliacoesController;