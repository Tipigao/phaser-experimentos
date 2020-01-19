var config = {
    type: Phaser.AUTO,
    //type: Phaser.WEBGL,
    width: 800,
    height: 600,
    antialias: true,
    multiTexture: true,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    physics: {
        default: 'impact',
        impact: {
            maxVelocity: 500
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    parent: 'contentorDesenho'
};

var game = new Phaser.Game(config);

var graphics, cenario, tempoDeJogo;

var textos = {
    centroGrande: null,
    centroInfo: null
};

var teclas = {
    espaco: 0,
    enter: 0,
    setaBaixo: 0,
    setaCima: 0,
    setaEsquerda: 0,
    setaDireita: 0,
};

var nave;

var inimigos = [];

function preload() {
    //this.load.setBaseURL(location.origin);
    this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');
    this.load.image('nave', 'assets/images/nave.png');
}

function create() {
    graphics = this.add.graphics();

    cenario = new CenarioFase1(this);

    textos.centroGrande = this.add.text(100, 100, '', { font: '64px Courier', fill: '#00ff00' });
    textos.centroInfo = this.add.text(100, 220, '', { font: '32px Arial', fill: '#00ff00', align: 'center' });

    nave = new Nave();
    nave.grafico = this.add.sprite(200, 200, 'nave').setScale(.2);

    const LIMITE_MISSEIS = 10;

    for (var i = 0; i < LIMITE_MISSEIS; i++) {
        var missel = new Missel();
        missel.grafico = new Phaser.Geom.Circle(nave.grafico.x, nave.grafico.y + 10, 2);
        var particles1 = this.add.particles('flares');
        missel.emissorTrajeto = particles1.createEmitter({
            frame: ['yellow'],
            x: 0,
            y: 0,
            lifespan: 300,
            angle: { min: 170, max: 190 },
            speed: { min: 100, max: 300 },
            scale: { start: 0.05, end: 0 },
            //gravityY: 300,
            //bounce: 0.9,
            //bounds: { x: 0, y: 0, w: 350, h: 0 },
            //collideTop: false,
            //collideBottom: false,
            blendMode: 'ADD'
        });

        var particles2 = this.add.particles('flares');
        missel.emissorExplosao = particles2.createEmitter({
            frame: ['blue'],
            x: 0,
            y: 0,
            lifespan: 200,
            //gravityY: 300,
            angle: { min: 0, max: 360 },
            speed: { min: 10, max: 700 },
            scale: { start: 0.1, end: 0 },
            blendMode: 'ADD'
        });

        missel.emissorTrajeto.setQuantity(0);
        missel.emissorExplosao.setQuantity(0);

        nave.misseis.push(missel);
    }

    //textos.centroGrande.setText([
    //    'Nível: ' + this.data.get('vidas'),
    //    'Vidas: ' + this.data.get('nivel'),
    //    'Pontos: ' + this.data.get('pontos')
    //]);

    teclas.espaco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    teclas.espaco.duration = 100;

    teclas.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    teclas.setaBaixo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    teclas.setaCima = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    teclas.setaEsquerda = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    teclas.setaDireita = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    this.impact.world.setBounds();

    preparaNovoJogo(this);
}

function preparaNovoJogo(_this) {

    _this.data.set('jogo-iniciado', false);
    _this.data.set('vidas', 0);
    _this.data.set('nivel', 0);
    _this.data.set('pontos', 0);
    _this.data.set('velocidade', 2);
    _this.data.set('rotacao-nave', 0);

    textos.centroInfo.setText([
        'Pressione Enter para começar',
        'um novo jogo'
    ]);
}

function iniciaNovoJogo(_this) {

    textos.centroInfo.setText('');

    cenario.inicializa();

    _this.data.set('jogo-iniciado', true);
}

function update(time, delta) {

    graphics.clear();

    tempoDeJogo = time;

    gerenciaTeclas(this);

    if (!this.data.get('jogo-iniciado')) {
        introducao(this);
    } else if (!game.paused) {
        cenario.atualiza();
        logicaJogo();
    }
}

function logicaJogo() {

    if (teclas.setaDireita.isDown) {
        nave.praFrente();
    }

    if (teclas.setaEsquerda.isDown) {
        nave.praTras();
    }

    if (teclas.setaBaixo.isDown) {
        nave.desce();
    }

    if (teclas.setaCima.isDown) {
        nave.sobe();
    }

    if (teclas.espaco.isDown) {
        nave.lancaMissel();
    }

    //if (Phaser.Input.Keyboard.JustDown(teclas.espaco)) {
    //    nave.lancaMissel();
    //}

    nave.executaLogica();

    if (inimigos.length == 0) {
        textos.centroInfo.setText([
            'Venceu'
        ]);
    }

    for (var i = 0; i < inimigos.length; i++) {

        var inimigo = inimigos[i];

        if (inimigo.abatido || inimigo.grafico.x < 0) {
            inimigos.splice(i, 1);
            i--;
            continue;
        }

        if (tempoDeJogo < inimigo.momentoAparicao)
            continue;

        inimigo.avanca();

        graphics.fillStyle(inimigo.cor);
        graphics.fillCircleShape(inimigo.grafico);

        var misselAcertou = nave.verificaColisaoArma(inimigo);
        if (misselAcertou && inimigo.vitalidade <= 0) {
            inimigo.mata();
        }

    }
}

function gerenciaTeclas(_this) {

    if (Phaser.Input.Keyboard.JustDown(teclas.enter)) {
        if (_this.data.get('jogo-iniciado')) {
            game.paused = !game.paused;
        } else {
            iniciaNovoJogo(_this);
        }
    }
}

function introducao(_this) {

}

function CenarioFase1(_this) {
    var instancia = _this;
    const LIMITE_ESTRELAS = 400;
    var estrelas = [];
    var inimigosFase;

    this.inicializa = function() {
        graphics.scene.cameras.main.setBackgroundColor(0x000000);
        for (var i = 0; i < Phaser.Math.Between(LIMITE_ESTRELAS * 0.8, LIMITE_ESTRELAS); i++) {
            estrelas.push(new Estrela(false));
        }

        inimigosFase = [];

        for (var j = 1; j <= 20; j++) {

            if (j === 2 || j === 12 || j === 18) {
                for (var i = 1; i <= 5; i++) {
                    var inimigo = new Inimigo();

                    inimigo.grafico = new Phaser.Geom.Circle(config.width + (i * 40), Phaser.Math.Between(100, config.height - 10), Phaser.Math.Between(10, 20));

                    var inimigoAnterior = inimigosFase[inimigosFase.length - 1];
                    inimigo.grafico.y = inimigoAnterior.grafico.y;
                    inimigo.momentoAparicao = inimigoAnterior.momentoAparicao;
                    inimigo.cor = inimigoAnterior.cor;
                    inimigo.vitalidade = 5;
                    inimigo.velocidade = inimigoAnterior.velocidade;

                    inimigosFase.push(inimigo);
                }
            } else {
                var inimigo = new Inimigo();
                inimigo.grafico = new Phaser.Geom.Circle(config.width + 20, Phaser.Math.Between(100, config.height - 10), Phaser.Math.Between(10, 20));
                inimigo.momentoAparicao = tempoDeJogo + (Phaser.Math.Between(3000 * j, 3000 * j * 1.5));
                inimigo.cor = Phaser.Math.Between(0x303030, 0xffffff);
                inimigo.vitalidade = 5;
                inimigo.velocidade = Phaser.Math.Between(3, 6);

                inimigosFase.push(inimigo);
            }
        }

        inimigos = inimigosFase;
    };

    this.atualiza = function() {
        for (var i = 0; i < estrelas.length; i++) {
            var pontos = estrelas[i].pontos;

            graphics.fillStyle(estrelas[i].cor);

            graphics.beginPath();

            graphics.moveTo(pontos[0], pontos[1]);

            for (var n = 2; n < pontos.length; n++) {
                graphics.lineTo(pontos[n], pontos[++n]);
            }

            graphics.closePath();
            graphics.fillPath();

            estrelas[i].desloca(estrelas[i].x - 1, estrelas[i].y);
            if (estrelas[i].x < -10) {
                estrelas.splice(i, 1);
                estrelas.push(new Estrela(true));
            }
        }
    };
}

function Estrela(noFinal) {
    var tam = Phaser.Math.Between(5, 20) / 10;

    this.x = noFinal ? Phaser.Math.Between(config.width, config.width * 2.2) : Phaser.Math.Between(0, config.width + (config.width * 1.1));
    this.y = Phaser.Math.Between(-20, config.height + 20);
    this.cor = Phaser.Math.Between(0x303030, 0xffffff);
    //this.cor = Phaser.Math.Between(0xfbfbfb, 0xffffff);

    if (this.cor * 1.5 < 0xffffff)
        this.cor += 0x010101;

    this.pontos = [
        this.x, this.y,
        this.x + tam, this.y + tam,
        this.x + tam + tam, this.y,
        this.x + tam, this.y - tam,
        this.x, this.y
    ];

    this.desloca = function(x, y) {
        this.x = x;
        this.y = y;

        var i = 0;

        this.pontos[i] = x;
        this.pontos[++i] = y;
        this.pontos[++i] = x + tam;
        this.pontos[++i] = y + tam;
        this.pontos[++i] = x + tam + tam;
        this.pontos[++i] = y;
        this.pontos[++i] = x + tam;
        this.pontos[++i] = y - tam;
        this.pontos[++i] = x;
        this.pontos[++i] = y;
    };
}

function Inimigo() {
    var self = this;
    this.momentoAparicao = 0;
    this.grafico = null;
    this.velocidade = 0.5;
    this.cor = 0xff0000;
    this.vitalidade = 0;
    this.abatido = false;

    this.mata = function() {
        self.abatido = true;
        //inimigo.x = Phaser.Math.Between(config.width, config.width * 1.5);
        //inimigo.y = Phaser.Math.Between(100, config.height - 10);
    };

    this.avanca = function() {
        self.grafico.x -= self.velocidade;
    };
}

function Nave() {
    var self = this;
    this.grafico = null;
    this.velocidade = 5;
    this.misseis = [];

    var tempoUltimoDisparo = 0;

    this.sobe = function() {
        if (nave.grafico.y - self.velocidade - 10 < 0) return;
        nave.grafico.y -= self.velocidade;
    }

    this.desce = function() {
        if (nave.grafico.y + self.velocidade + 10 > config.height) return;
        nave.grafico.y += self.velocidade;
    }

    this.praFrente = function() {
        if (nave.grafico.x + self.velocidade + 40 > config.width) return;
        self.grafico.x += self.velocidade;
    }

    this.praTras = function() {
        if (nave.grafico.x - self.velocidade - 40 < 0) return;
        self.grafico.x -= self.velocidade;
    }

    this.executaLogica = function() {
        for (var i = 0; i < self.misseis.length; i++) {
            if (!self.misseis[i].emUso)
                continue;

            self.misseis[i].avanca();
        }
    }

    this.lancaMissel = function(alvo) {
        if (tempoDeJogo <= tempoUltimoDisparo)
            return;

        for (var i = 0; i < self.misseis.length; i++) {
            if (self.misseis[i].emUso)
                continue;

            self.misseis[i].setPosition(self.grafico.x, self.grafico.y);
            self.misseis[i].dispara(alvo);
            tempoUltimoDisparo = tempoDeJogo + 100;
            break;
        }
    }

    this.verificaColisaoArma = function(alvo) {
        for (var i = 0; i < self.misseis.length; i++) {
            if (!self.misseis[i].emUso)
                continue;

            var missel = self.misseis[i];
            if (missel.grafico.x < (config.width * 1.2) &&
                Phaser.Geom.Intersects.CircleToCircle(alvo.grafico, missel.grafico)) {

                alvo.vitalidade -= missel.dano;
                missel.explode();

                return true;
            }
        }
        return false;
    }
}

function Missel() {
    var self = this;

    this.dano = 5;
    this.grafico = null;
    this.velocidade = 10;
    this.emissorTrajeto = null;
    this.emissorExplosao = null;
    this.emUso = false;
    var emExplosao = false;

    var restaura = function() {
        self.emUso = false;
        emExplosao = false;

        self.grafico.x = 0;
        self.grafico.y = 0;

        self.emissorTrajeto.setQuantity(0);
        self.emissorTrajeto.setPosition(self.grafico.x, self.grafico.y);
        self.emissorExplosao.setQuantity(0);
        self.emissorExplosao.setPosition(self.grafico.x, self.grafico.y);
    }

    this.setPosition = function(x, y) {
        if (emExplosao)
            return;

        self.grafico.x = x;
        self.grafico.y = y;

        self.emissorTrajeto.setPosition(x, y);
        self.emissorExplosao.setPosition(x, y);
    }

    this.avanca = function() {
        if (self.grafico.x >= (config.width * 1.1)) {
            restaura();
            return;
        }

        if (!self.emUso)
            return;

        var x = self.grafico.x + self.velocidade;
        var y = self.grafico.y;

        self.setPosition(x, y);
    };

    this.dispara = function() {
        self.avanca();
        self.emissorTrajeto.setQuantity(20);
        self.emUso = true;
    }

    this.explode = function() {
        self.emissorExplosao.setQuantity(80);
        self.emissorExplosao.setPosition(self.grafico.x, self.grafico.y);

        //Ao deslocar o objeto gráfico para outra posição, previne que um mesmo míssel atinja mais de um alvo
        self.grafico.x = 0;

        //Previne que a xlosão seja deslocada junto com o objeto gráfico
        emExplosao = true;

        setTimeout(restaura, 100);
    }
}

//https://www.sitepoint.com/javascript-generate-lighter-darker-color/
function colorLuminance(hex, lum) {
    // Validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, "");
    if (hex.length < 6) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    lum = lum || 0;
    // Convert to decimal and change luminosity
    var rgb = "#",
        c;
    for (var i = 0; i < 3; ++i) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }
    return rgb;
}