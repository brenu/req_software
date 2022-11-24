const bd = require("../config/bd");

class AvaliacoesViewsController {
    static async index(req, res) {
        const { id_projeto } = req.params;

        const questoes = (await bd.query("SELECT id, questao, resposta FROM questoes_avaliacao_projeto WHERE id_projeto = $1", [id_projeto])).rows;

        return res.render('pages/avaliacao', {
            questoes,
            id_projeto
        });
    }
}

module.exports = AvaliacoesViewsController;