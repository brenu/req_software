const express = require('express');
const cookieParser = require('cookie-parser');
const bd = require('./config/bd');
const session = require('./config/session');
const app = express();
const crypto = require('crypto');
const Requisito = require('./models/requisito');
const RequisitosController = require('./controllers/requisitos');
const RequisitosViewsController = require('./controllers/requisitosViews');
const AssociacoesViewsController = require('./controllers/associacoesViews');
const AssociacoesController = require('./controllers/associacoes');
const ProjetosViewsController = require('./controllers/projetosViews');
const ProjetosController = require('./controllers/projetos');
const AvaliacoesViewsController = require('./controllers/avaliacoesViews');
const AvaliacoesController = require('./controllers/avaliacoes');

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session);

const authMiddleware = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    return res.redirect("/login");
  }
};

app.get('/', function(req, res) {
  if (req.session.user) {{
    return res.redirect("/edit-user");
  }}

  return res.redirect("/login");
});

app.get('/login', function(req, res) {
  res.render('pages/login', {erro: ""});
});

app.post('/login', async (req, res) => {
  let { username, senha } = req.body;

  try {
    senha = crypto.pbkdf2Sync(senha, process.env.SESSIONS_SECRET, 1000, 64, 'sha512').toString('hex');

    const result = await bd.query("SELECT id, senha, email FROM usuarios WHERE username = $1", [username]);
    const {id, senha: hashRegistrada, email} = result.rows[0];

    if (senha !== hashRegistrada) {
      return res.render('pages/login', {
        erro: "usuário ou senha incorretos"
      });
    }

    req.session.user = {id, username, email};
    return res.redirect("/edit-user");
  } catch (error) {
    return res.render('pages/login', {
      erro: "usuário ou senha incorretos"
    });
  }
});

app.get('/register', function(req, res) {
  res.render('pages/user_form', {
    type: "register",
    erro: "",
  });
});

app.post('/register', async (req, res) => {
  let { username, senha, email } = req.body;

  try {
    senha = crypto.pbkdf2Sync(senha, process.env.SESSIONS_SECRET, 1000, 64, 'sha512').toString('hex');

    const result = await bd.query("INSERT INTO usuarios (username, senha, email) VALUES ($1, $2, $3) RETURNING id", [username, senha, email]);
    const id = result.rows[0].id;

    req.session.user = {id, username, email};

    return res.redirect("/edit-user");
  } catch (error) {
    return res.render('pages/user_form', {
      type: "register",
      username,
      senha,
      email,
      erro: "revise os campos e tente novamente"
    });
  }
});

app.get('/edit-user', authMiddleware, function(req, res) {
  res.render('pages/user_form', {
    type: "edit",
    username: req.session.user.username,
    senha: req.session.user.senha,
    email: req.session.user.email,
    erro: "",
  });
});

app.post('/edit-user', authMiddleware, async (req, res) => {
  let { username, senha, email } = req.body;

  try {
    let query = "UPDATE usuarios SET ";
    let parameters = [];
    
    if (username) {
      parameters.push(username);
      query += `username = $${parameters.length}`;
    }

    if (senha) {
      senha = crypto.pbkdf2Sync(senha, process.env.SESSIONS_SECRET, 1000, 64, 'sha512').toString('hex');
      parameters.push(senha);
      query += `${parameters.length > 1 ? "," : ""} senha = $${parameters.length}`;
    }

    if (email) {
      parameters.push(email);
      query += `${parameters.length > 1 ? "," : ""} email = $${parameters.length}`;
    }

    parameters.push(req.session.user.id);
    query += ` WHERE id = $${parameters.length}`

    await bd.query(query, parameters);

    req.session.user.username = username ? username : req.session.user.email;
    req.session.user.email = email ? email : req.session.user.email;

    return res.redirect("/edit-user");
  } catch (error) {
    return res.render('pages/user_form', {
      type: "edit",
      username,
      senha,
      email,
      erro: "revise os campos e tente novamente"
    });
  }
});

app.get("/projetos", authMiddleware, ProjetosViewsController.index);
app.get("/projetos/create", authMiddleware, ProjetosViewsController.create);

app.post("/projetos/create", authMiddleware, ProjetosController.create);

app.get("/requirements/:id_projeto/create", authMiddleware, RequisitosViewsController.create);

app.get("/requirements/:id_projeto", authMiddleware, RequisitosController.index);

app.post("/requirements/:id_projeto/create", authMiddleware, RequisitosController.create);

app.get("/requirements/:id_projeto/edit/:id", authMiddleware, RequisitosViewsController.edit);

app.post("/requirements/:id_projeto/edit/:id", authMiddleware, RequisitosController.edit);

app.get("/requirements/:id_projeto/delete/:id", authMiddleware, RequisitosController.delete);

app.get("/associacoes/:id_projeto", authMiddleware, AssociacoesViewsController.index);

app.get("/associacoes/:id_projeto/create", authMiddleware, AssociacoesViewsController.create);
app.post("/associacoes/:id_projeto/create", authMiddleware, AssociacoesController.create);

app.get("/associacoes/:id_projeto/delete/:id", authMiddleware, AssociacoesController.delete);

app.get("/avaliacao/:id_projeto", authMiddleware, AvaliacoesViewsController.index);
app.get("/avaliacao/:id_projeto/create", authMiddleware, AvaliacoesViewsController.create);
app.post("/avaliacao/:id_projeto", authMiddleware, AvaliacoesController.update);
app.post("/avaliacao/:id_projeto/create", authMiddleware, AvaliacoesController.create);
app.get("/avaliacao/:id_projeto/delete/:id", authMiddleware, AvaliacoesController.delete);

app.get("/atributos/:id_projeto", authMiddleware, RequisitosController.attributes);

app.listen(8080);
console.log('Server is listening on port 8080');