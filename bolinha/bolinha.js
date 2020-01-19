var config = {
    //type: Phaser.AUTO,
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    physics: {
        default: 'impact',
        impact: {
            maxVelocity: 500
        }
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    },
    parent: 'contentorDesenho'
};

//var canvas, fullscreen;
var retangulo, bola, plataforma;
var graphics;
var infoBola = {
    x: 1,
    y: 1,
    velocidade: 0,
    linhaEsquerda: null,
    linhaTopo: null,
    linhaDireita: null,
    linhaBaixo: null
};

var textoPontos, textoCentro, textoInstrucao, pontuacao;
var teclas = {
    espaco: 0
        //esc: 0
};

var particles, emitter;

var game = new Phaser.Game(config);

function init() {
    //canvas = this.sys.game.canvas;
    //fullscreen = this.sys.game.device.fullscreen;
}

function preload() {
    this.load.setBaseURL('http://labs.phaser.io');
    this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');
}

function create() {
    //graphics = this.add.graphics();

    graphics = this.add.graphics({ lineStyle: { width: 8, color: 0xaa00aa } });

    textoInstrucao = this.add.text((config.width / 2) - 150, (config.height / 2) + 30, 'Aperte Espaço para recomeçar', { fontFamily: 'Arial', fontSize: 20, color: '#ffff77' });

    textoPontos = this.add.text(10, 10, '0', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#ff00ff',
        shadow: {
            color: '#000000',
            fill: true,
            offsetX: 2,
            offsetY: 2,
            blur: 8
        }
    });

    bola = new Phaser.Geom.Circle(100, 100, 20);
    retangulo = new Phaser.Geom.Rectangle(0, 450, 100, 10);
    plataforma = new Phaser.Geom.Line(0, 450, 100, 450);

    infoBola.linhaEsquerda = new Phaser.Geom.Line(0, 0, 0, config.height);
    infoBola.linhaTopo = new Phaser.Geom.Line(0, 0, config.width, 0);
    infoBola.linhaDireita = new Phaser.Geom.Line(config.width, 0, config.width, config.height);
    infoBola.linhaBaixo = new Phaser.Geom.Line(0, config.height, config.width, config.height);

    particles = this.add.particles('flares');

    emitter = particles.createEmitter({
        frame: ['red', 'green', 'blue'],
        x: 400,
        y: 400,
        lifespan: 4000,
        angle: { min: 225, max: 315 },
        speed: { min: 200, max: 500 },
        scale: { start: 0.4, end: 0 },
        gravityY: 300,
        bounce: 0.9,
        //bounds: { x: 0, y: 0, w: 350, h: 0 },
        collideTop: false,
        collideBottom: false,
        blendMode: 'ADD'
    });

    //  Calling this with no arguments will set the bounds to match the game config width/height
    this.impact.world.setBounds();

    //emitter.setQuantity(0);

    this.input.on('pointermove', function(pointer) {
        //Phaser.Geom.Rectangle.CenterOn(retangulo, pointer.x, 455);
        Phaser.Geom.Line.CenterOn(plataforma, pointer.x, 455);

        if (infoBola.perdeu) {
            textoCentro.visible = true;
            textoInstrucao.visible = true;
            textoCentro.setText("Perdeu");
            //emitter.setPosition(pointer.x, 455);
        }

    });

    teclas.espaco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    //teclas.esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    iniciaNovoJogo(this);

}

function iniciaNovoJogo(_this) {

    if (textoCentro == null) {
        textoCentro = _this.add.text(config.width / 2, config.height / 2, '', { fontFamily: 'Arial', fontSize: 32, color: '#ffff00' });
        textoCentro.setOrigin(0.5);
    }

    infoBola.perdeu = false;
    infoBola.x = 1;
    infoBola.y = 1;
    infoBola.velocidade = 3;
    bola.x = 50;
    bola.y = 50;
    pontuacao = 0;

    textoPontos.setText(pontuacao.toString());

    textoCentro.setText("Mova o mouse pra jogar");
    textoCentro.visible = true;

    textoInstrucao.visible = false;

    emitter.setQuantity(0);
    emitter.setSpeed({ min: 200, max: 500 });

    setTimeout(function() {
        textoCentro.visible = false;
    }, 3000);
}

function update() {

    graphics.clear();

    graphics.lineStyle(20, 0x00ff00);
    graphics.strokeLineShape(infoBola.linhaEsquerda);

    graphics.lineStyle(20, 0xaa0000);
    graphics.strokeLineShape(infoBola.linhaTopo);

    graphics.lineStyle(20, 0x0000aa);
    graphics.strokeLineShape(infoBola.linhaDireita);

    graphics.lineStyle(20, 0xaaff00);
    graphics.strokeLineShape(infoBola.linhaBaixo);

    if (!infoBola.perdeu) {
        if (Phaser.Geom.Intersects.LineToCircle(infoBola.linhaBaixo, bola)) {
            infoBola.perdeu = true;

            setTimeout(function() {
                emitter.setSpeed({ min: 50, max: 1200 });
                emitter.setQuantity(Math.max(80, Math.ceil(infoBola.velocidade)));
                emitter.setFrame(['green', 'blue', 'red', 'yellow']);
                emitter.setAngle({ min: 180, max: 360 });
                emitter.setPosition(bola.x, config.height - 10);
            }, 100);

            setTimeout(function() {
                emitter.setSpeed({ min: 50, max: 1200 });
                emitter.setQuantity(0);
                emitter.setFrame(['green', 'blue', 'red', 'yellow']);
                emitter.setAngle({ min: 180, max: 360 });
                emitter.setPosition(bola.x, config.height - 10);
            }, 200);
        }

        if (Phaser.Geom.Intersects.LineToCircle(infoBola.linhaEsquerda, bola)) {
            infoBola.x *= -1;

            emitter.setSpeed({ min: 100, max: 300 });
            emitter.setQuantity(Math.ceil(infoBola.velocidade));
            emitter.setFrame(['green']);
            emitter.setAngle({ min: -45, max: 45 });
            emitter.setPosition(bola.x, bola.y + 10);
            setTimeout(function() {
                emitter.setQuantity(0);
            }, 50);
        }

        if (Phaser.Geom.Intersects.LineToCircle(infoBola.linhaDireita, bola)) {
            infoBola.x *= -1;

            emitter.setSpeed({ min: 100, max: 300 });
            emitter.setFrame(['blue']);
            emitter.setQuantity(Math.ceil(infoBola.velocidade));
            emitter.setAngle({ min: 135, max: 215 });
            emitter.setPosition(bola.x, bola.y + 10);

            setTimeout(function() {
                emitter.setQuantity(0);
            }, 50);
        }

        if (Phaser.Geom.Intersects.LineToCircle(infoBola.linhaTopo, bola)) {
            infoBola.y *= -1;
            emitter.setSpeed({ min: 200, max: 500 });
            emitter.setQuantity(Math.ceil(infoBola.velocidade));
            emitter.setFrame(['red']);
            emitter.setAngle({ min: 45, max: 135 });
            emitter.setPosition(bola.x, bola.y + 10);
            setTimeout(function() {
                emitter.setQuantity(0);
            }, 50);
        }

        if (Phaser.Geom.Intersects.LineToCircle(plataforma, bola)) { //if (Phaser.Geom.Intersects.CircleToRectangle(bola, retangulo))
            infoBola.y *= -1;
            infoBola.velocidade += 0.3;

            pontuacao += 10;
            textoPontos.setText(pontuacao.toString());

            emitter.setQuantity(Math.ceil(infoBola.velocidade * 1.5));
            emitter.setFrame(['yellow']);
            emitter.setAngle({ min: 225, max: 315 });

            emitter.setPosition(bola.x, bola.y + 10);

            setTimeout(function() {
                emitter.setQuantity(0);
            }, 150);

            graphics.fillStyle(0xff0000);
        } else {
            graphics.fillStyle(0x0060ff);
        }

        bola.x += infoBola.x * infoBola.velocidade;
        bola.y += infoBola.y * infoBola.velocidade;

        graphics.fillCircleShape(bola);
    }

    if (infoBola.perdeu) {
        textoCentro.visible = true;
        textoInstrucao.visible = true;
        textoCentro.setText("Perdeu");
    }

    graphics.lineStyle(10, 0xffcc00);
    graphics.strokeLineShape(plataforma);

    gerenciaTeclas();

    //graphics.fillStyle(0xffcc00);
    //graphics.fillRectShape(retangulo);

}

var bTelaCheia = false;

function gerenciaTeclas() {

    if (teclas.espaco.isDown) {
        iniciaNovoJogo(this);
    }

    //if (!bTelaCheia && Phaser.Input.Keyboard.JustDown(teclas.esc)) {
    //    bTelaCheia = true;
    //    if (fullscreen.available) {
    //        if (!fullscreen.active) {
    //            canvas[fullscreen.request]();
    //        }
    //        else {
    //            canvas[fullscreen.cancel]();
    //        }
    //    }
    //}
}