var Veggies = Veggies || {};

Veggies.Plant = function(state, x, y, data, patch) {
    Phaser.Sprite.call(this, state.game, x, y, data.plantAsset);

    this.state = state;
    this.game = state.game;
    this.bullets = state.bullets;
    this.suns = state.suns;

    this.anchor.setTo(0.5);
    
    //init physical body
    this.game.physics.arcade.enable(this);
    this.body.immovable = true;
    
    //creating a timer for plannts
    this.shootingTimer = this.game.time.create(false);
    this.producingTimer = this.game.time.create(false);
    
    this.reset(x, y, data, patch)
};

Veggies.Plant.prototype = Object.create(Phaser.Sprite.prototype);
Veggies.Plant.prototype.constructor = Veggies.Plant;

Veggies.Plant.prototype.reset = function(x, y, data, patch){
    Phaser.Sprite.prototype.reset.call(this, x, y, data.health);
    
    //change a image of the pl0ant
    this.loadTexture(data.plantAsset);
    //animation forshooting
    this.animationName = null;
    if(data.animationFrames){
        this.animationName = data.plantAsset + ' Anim';
        this.animations.add(this.animationName, data.animationFrames, 6, false);
        this.play(this.animationName);
    }
    //saving properties
    this.isShooter = data.isShooter;
    this.isSunProducer = data.isSunProducer;
    this.patch = patch;
    
    //if plant is a shooter then setup shooting timer
    if(this.isShooter){
        this.shootingTimer.start();
        this.sheduleShooting();
    }
    //if plant is a producer then setup producing timer
    if(this.isSunProducer){
        this.producingTimer.start();
        this.sheduleProduction();
    }
};

Veggies.Plant.prototype.kill = function() {
    Phaser.Sprite.prototype.kill.call(this)
    
    //stop timers
    this.shootingTimer.stop();
    this.producingTimer.stop();
    
    //freeing the patch
    this.patch.isBusy = false;

};

Veggies.Plant.prototype.sheduleShooting = function() {
    this.shoot();
    
    //plantss are going to shoot once per second
    this.shootingTimer.add(Phaser.Timer.SECOND, this.sheduleShooting, this);
};

Veggies.Plant.prototype.shoot = function(){
    //play shooting animation
    if(this.animations.getAnimation(this.animationName)){
        this.play(this.animationName);
    }
    
    //pool of bullets
    var newElement = this.bullets.getFirstDead();
        var y = this.y - 10;
        //if there no dead ones create a new one
            if(!newElement){
                newElement = new Veggies.Bullet(this, this.x, y);
                this.bullets.add(newElement);
            }
            else
            {
                newElement.reset(this.x, y);
            }
        newElement.body.velocity.x = 100;
};
    

Veggies.Plant.prototype.sheduleProduction = function() {
    //create a random sun
    this.produceSun();
    
    //plantss are going to produce once per second
    this.producingTimer.add(Phaser.Timer.SECOND * 5, this.sheduleProduction, this);
};
    
Veggies.Plant.prototype.produceSun = function(){
    //plance the sun in a random location near the plant
    var diffX = -40 + Math.random() * 80;
    var diffY = -40 + Math.random() * 80;
    this.state.createSun(this.x + diffX, this.y + diffY);
    
};