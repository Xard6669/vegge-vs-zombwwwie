var Veggies = Veggies || {};

Veggies.GameState = {

  init: function(currentLevel) {    
    //keep track of the current level
    this.currentLevel = currentLevel ? currentLevel : 'level1';
      
    //constans
    this.HOUSE_X = 60;
    this.SUN_FREQUANCY = 5;
    this.SUN_VELOCITY = 50;
    this.ZOMBIE_Y_POSITIONS = [49, 99, 149, 199, 249];

    //no gravity in a top-down game
    this.game.physics.arcade.gravity.y = 0;    
  },
  create: function() {
    this.background = this.add.sprite(0, 0, 'background');
      
    //create Land Patches
    this.createLandPathes();

    //group for game objects
    this.bullets = this.add.group();
    this.plants = this.add.group();
    this.zombies = this.add.group();
    this.suns = this.add.group();
      
    //player stats
    this.numSuns =1000;
      
    //create user interface
    this.createGui();
      
      //creating a suns on specified frequency
      this.sunGenerationTimer = this.game.time.create(false);
      this.sunGenerationTimer.start();
      this.scheduleSunGeneration();
      
      //hiting sound
      this.hitSound = this.add.audio('hit');
      
      //loading a level
      this.loadLevel();
  },   
  update: function() {
      //checking a collision betwen sprites
      this.game.physics.arcade.collide(this.plants, this.zombies, this.attackPlant, null, this);
      this.game.physics.arcade.collide(this.bullets, this.zombies, this.hitZombie, null, this);
      
      //keeping zombie moving
      this.zombies.forEachAlive(function(zombie){
          zombie.body.velocity.x = zombie.defaultVelocity;
          
          //checking if zombie reach the house
          if(zombie.x <= this.HOUSE_X){
              this.gameOver();
          }
      },this)
    
  },  
  gameOver: function() {
    this.game.state.start('Game');
  },
    attackPlant: function(plant, zombie){
        plant.damage(zombie.attack);
        console.log(zombie.attack);
    },
    
    createZombie: function(x, y, data){
        //look for dead element
        var newElement = this.zombies.getFirstDead();
        
        //if there no dead ones create a new one
            if(!newElement){
                newElement = new Veggies.Zombie(this, x, y, data);
                this.zombies.add(newElement);
            }
            else
            {
                newElement.reset(x, y, data);
            }
        return newElement;
        
    },
    
    createPlant: function(x, y, data, patch){
        //look for dead element
        var newElement = this.plants.getFirstDead();
        
        //if there no dead ones create a new one
            if(!newElement){
                
                newElement = new Veggies.Plant(this, x, y, data, patch);
                this.plants.add(newElement);
                
            }
            else{
                newElement.reset(x, y, data, patch);
            }
        
        return newElement;
    },
    
    //IMPORTANT
    createGui: function(){
        //show sun stats
        var sun = this.add.sprite(10, this.game.height - 20, 'sun');
        sun.anchor.setTo(0.5);
        sun.scale.setTo(0.5);
        var style = {font: '14px Arial', fill: '#000'}
        this.sunLabel = this.add.text(22, this.game.height - 28, '', style);
        this.updateStats();
        
        //show button bar
        this.buttonData = JSON.parse(this.game.cache.getText('buttonData'));
        
        //buttons
        this.buttons = this.add.group();
        
        this.buttonData.forEach(function(element, index){
            button = new Phaser.Button(this.game, 80 + index * 40, this.game.height - 35, element.btnAsset, this.clickButton, this)
            this.buttons.add(button);
            
            //pass the data to the button
            button.plantData = element;
        },this)
        
        this.plantLabel = this.add.text(300, this.game.height - 28, '' , style);
    },
    
    updateStats: function(){
        this.sunLabel.text = this.numSuns;
    },
    
    increseSun: function(amount){
        this.numSuns += amount;
        this.updateStats();
    },
    
    scheduleSunGeneration: function(){
        this.sunGenerationTimer.add(Phaser.Timer.SECOND * this.SUN_FREQUANCY, function(){
            this.generateRandomSun();
            this.scheduleSunGeneration();
        },this)
    },

    generateRandomSun: function(){
        //position
        var y = -20;
        var x = 40 + 420 * Math.random();
        
        //sun object
        var sun= this.createSun(x, y);
        
        //falling velocity
        sun.body.velocity.y = this.SUN_VELOCITY;
        
        var newElement = this.plants.getFirstDead();
        
    },
        createSun: function(x, y){
        //look for dead element
        var newElement = this.suns.getFirstDead();
        
        //if there no dead ones create a new one
            if(!newElement){
                
                newElement = new Veggies.Sun(this, x, y);
                this.suns.add(newElement);
                
            }
            else{
                newElement.reset(x, y);
            }
        
        return newElement;
    },
    
    hitZombie: function(bullet, zombie){
        bullet.kill();
        zombie.damage(1);
        this.hitSound.play();
        
        //if zombie was killed increase a counter
        if(!zombie.alive){
            this.killedEnemies++;
        }
        //next level when they are all dead
        if(this.killedEnemies == this.numEnemies){
            this.game.state.start('Game', true, false, this.levelData.nextLevel);
        }
    },
    
    clickButton: function(button){
        if(!button.selected){
            this.clearSelection();
            this.plantLabel.text = 'Cost: ' +button.plantData.cost;
            
            //chceck if you can afford it
            if(this.numSuns >= button.plantData.cost){
                button.selected = true;
                button.alpha = 0.5
                
                //keep track of the data
                this.currentSelection = button.plantData;
            }
            else{
                this.plantLabel.text += " - Too expensive!";
                
            }
        }
        else{
            this.clearSelection();
        }
    },
    
    clearSelection: function(){
        this.buttons.forEach(function(button){
            button.alpha = 1;
            button.selected = false;
            this.currentSelection = null;
        },this)
    },
    
    createLandPathes: function(){
        this.patches = this.add.group();
        
        //rectangle to be used
        var rectangle = this.add.bitmapData(40,50);
        rectangle.ctx.fillStyle = '#000';
        rectangle.ctx.fillRect(0, 0, 40, 50);
        
        var j, patch, alpha;
        var dark = false;
        
        for(var i = 0; i < 10; i++){
            for(j = 0; j < 5; j++){
                //create a patch
                patch = new Phaser.Sprite(this.game, 64 + i * 40, 24 + j * 50, rectangle)
                this.patches.add(patch);
                
                //alternate transparenct so it looks like a chest board
                alpha = dark ? 0.2 : 0.1;
                dark = !dark;
                
                patch.alpha = alpha;
                
                //plant something on the patch if it is avalible
                patch.inputEnabled = true;
                patch.events.onInputDown.add(this.plantPlant, this);
            }
        }
    },
    plantPlant: function(patch){
        if(!patch.isBusy && this.currentSelection){
            patch.isBusy = true;
            
            //create a new plant
            var plant = this.createPlant(patch.x + patch.width/2, patch.y + patch.height/2, this.currentSelection, patch);
            
            //substact cost
            this.increseSun(-this.currentSelection.cost);
            this.clearSelection();
            
        }
    },
    
    loadLevel: function(){
        //parse loaded json file
        this.levelData = JSON.parse(this.game.cache.getText(this.currentLevel));
        
        //keep track of what enemy needsto be shown next
        this.currentEnemyIndex = 0;
        
        this.killedEnemies = 0;
        this.numEnemies = this.levelData.zombies.length;
        
        this.scheduleNextEnemy();
    },
    
    scheduleNextEnemy:function (){
        var nextEnemy = this.levelData.zombies[this.currentEnemyIndex];
        
        if(nextEnemy){
            var nextTime = 1000 * (nextEnemy.time - (this.currentEnemyIndex == 0 ? 0 : this.levelData.zombies[this.currentEnemyIndex - 1].time));
            
            this.nextEnemyTimer = this.game.time.events.add(nextTime, function(){
                //random y position
                var y = this.ZOMBIE_Y_POSITIONS[Math.floor(Math.random() * this.ZOMBIE_Y_POSITIONS.length)];
                this.createZombie(this.game.world.width + 40, y, nextEnemy);
                
                this.currentEnemyIndex++;
                this.scheduleNextEnemy();
            }, this)
        }
    }
};
