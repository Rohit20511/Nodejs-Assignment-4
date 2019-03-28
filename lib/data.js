/*
 * Library for storing and editing data
 *
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for module (to be exported)
var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir,file,data,callback){
  // Open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData,function(err){
        if(!err){
          fs.close(fileDescriptor,function(err){
            if(!err){
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });

};

// Read data from a file
lib.read = function(dir,file,callback){
  fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', function(err,data){
    if(!err && data){
      var parsedData = helpers.parseJsonToObject(data);
      callback(false,parsedData);
    } else {
      callback(err,data);
    }
  });
};

// Update data in a file
lib.update = function(dir,file,data,callback){

  // Open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Truncate the file
      fs.truncate(fileDescriptor,function(err){
        if(!err){
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData,function(err){
            if(!err){
              fs.close(fileDescriptor,function(err){
                if(!err){
                  callback(false);
                } else {
                  callback('Error closing existing file');
                }
              });
            } else {
              callback('Error writing to existing file');
            }
          });
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open file for updating, it may not exist yet');
    }
  });

};

// Delete a file
lib.delete = function(dir,file,callback){

  // Unlink the file from the filesystem
  fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
    callback(err);
  });

};

// List all the items in a directory
lib.list = function(dir,callback){
  fs.readdir(lib.baseDir+dir+'/', function(err,data){
    if(!err && data && data.length > 0){
      var trimmedFileNames = [];
      data.forEach(function(fileName){
        trimmedFileNames.push(fileName.replace('.json',''));
      });
      callback(false,trimmedFileNames);
    } else {
      callback(err,data);
    }
  });
};


// Get all foods on the system
lib.foods = (callback)=>{
  callback(false, [
    {
      id: "1",
      name: "Black Pizza",
      price: 2000,
      image: 'm1.jpg'
    },
    {
      id: "2",
      name: "White Pizza",
      price: 3000,
      image: 'm2.jpg'
    },
    {
      id: "3",
      name: "Yellow Pizza",
      price: 4000,
      image: 'm3.jpg'
    },
    {
      id: "4",
      name: "Rowdy Pizza",
      price: 5000,
      image: 'm4.jpg'
    },
    {
      id: "5",
      name: "English  Pizza",
      price: 6000,
      image: 'm5.jpg'
    },
    {
      id: "6",
      name: "Hello Pizza",
      price: 7000,
      image: 'm6.jpg'
    },
    {
      id: "7",
      name: "Chilli Pizza",
      price: 8000,
      image: 'm7.jpg'
    },
  ]);
};

lib.food = (id, callback)=>{
  lib.foods((err, data)=>{
    var food;

    data.map((food_, i)=>{
      if(food_.id == id)
        food = food_;
    });

    if(food)
      callback(false,food);
    else{
      callback(true);
    }
  });
};

// Export the module
module.exports = lib;
