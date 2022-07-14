//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-ritik:Test123@cluster0.qmtzfcd.mongodb.net/todolistDB");

const itemsSchema={
  name: String
};
//Mongoose model is usually capitalised
const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Welcome to your todolist!"
});

const item2=new Item({
  name:"Hit the + button to add a new item"
});

const item3=new Item({
  name:"<-- Hit this to delete an item."
});

const defaultItems=[item1 ,item2 ,item3];

const listSchema={
  name: String,
  items:[itemsSchema]
};

const List=mongoose.model("List", listSchema);



app.get("/", function(req, res) {

//Empty set signifies find all
  Item.find({}, function(err,foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        } else{
          console.log("Successfully inserted default Items to database");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});
app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        const list=new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else{
        //Show an existing list
        res.render("list",{listTitle: foundList.name,newListItems:foundList.items});
      }
    }
  });


});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;

  const item=new Item({
    name:itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted the checked item");
        res.redirect("/");
      }
    });
  } else{
    //items is name of our array
    //in this array we pull the id which matches the checkedId
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
