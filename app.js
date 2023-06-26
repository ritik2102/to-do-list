//jshint esversion:6


// express
const express = require("express");

// Setting view engine as ejs
const app = express();

// we are telling app.js to use the public folder for the static files (we are putting our css inside public folder)
app.use(express.static("public"));





// bodyParser

// bodyparser is used to read the data using req.body
const bodyParser = require("body-parser");

// We are telling our app to use the body-parser
app.use(bodyParser.urlencoded({extended: true}));





// lodash, e are using it to change the customListName to a particular format(first character as upper case, and the rest as lower case)
const _ = require("lodash");





// ejs functionality(first install ejs)
// Setting the view engine to ejs
app.set('view engine', 'ejs');





// mongoose all implementation
const mongoose = require("mongoose");
// connecting to our mongoDB database
mongoose.connect("mongodb+srv://admin-ritik:Test123@cluster0.qmtzfcd.mongodb.net/todolistDB");

// schema for individual item
const itemsSchema={
  name: String
};
//Mongoose model is usually capitalised(here we are creating a model and a collection using the schema)
// collection is created with the string provided inside model as a parameter
// the model name is what the mongoose.model is assigned to
const Item=mongoose.model("Item",itemsSchema);

// creating individual 
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


// list schema
// list is going to have items
// we willl use these lists for the custom lists
const listSchema={
  name: String,
  items:[itemsSchema]
};
// List model created using the listSchema
const List=mongoose.model("List", listSchema);







// app.get() functionality for the home route
app.get("/", function(req, res) {


//Empty set signifies find all 
// finding everything inside Items colletion and storing it inside foundItems array
  Item.find({}, function(err,foundItems){

    // if the custom list becomes empty, the default items are inserted again into the list
    // if the default item list becomes empty, foundItems becomes empty immediately
    if(foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        } else{
          console.log("Successfully inserted default Items to database");
        }
      });
      // when the ;list becomes empty, the default items are inserted immediately and the page is redirected to the home route
      res.redirect("/");
    }else{
      // in this case, we are rendering a page called list.ejs(inside the folder views)
      // We are sending listTitle(Today is the value) and newListItems(foundItems is the value) as the variable names with their values
      // listName is "Today for the default home route list"
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});



// if the app is routed to a listname through the search tab(such as localhost:3000/work), then instead of working on the home route, work is carried on this custom route
app.get("/:customListName",function(req,res){
  // capitalize is defined in lodash
  const customListName = _.capitalize(req.params.customListName);

  // we ceck if the listName already exists or this is the first time e have logged to the custom list
  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      // if it is the first time, we create a list using this listName
      if(!foundList){
        //Create a new list with name as custom-list name and save it,after that we redirect to the specified route
        const list=new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      // if the list already exists, we simply render it 
      else{
        //Show an existing list
        res.render("list",{listTitle: foundList.name,newListItems:foundList.items});
      }
    }
  });


});

// app.post is triggered when we add a new item
app.post("/", function(req, res){

  // The values are extracted from the list.ejs page using body-parser
  const itemName = req.body.newItem;
  const listName=req.body.list;

  const item=new Item({
    name:itemName
  });

  // if the listName is "Today", it will be added to the today list
  if(listName === "Today"){
    // item gets saved into our collection named Items
    item.save();
    // will redirect to the home route(what this does is it will get the execution to app.get with the home route (triggers it))
    // and from there it will res.render whatever we are trying to render
    setTimeout(()=>res.redirect("/"),500);
  }
  // if the lisname is different than the default(i.e. today) 
  else{
    // We try to find the list-Name  and push the item item into the foundList, save it and edirect it to the custom route
    List.findOne({name: listName},function(err,foundList){
      // push the item in the foundList and save it
      foundList.items.push(item);
      foundList.save();
      // redirect to thee custom route ,i.e. get request for the custom rute is executed 
      setTimeout(()=>res.redirect("/"+listName),500);
    })
  }
});


// the delete route
app.post("/delete",function(req,res){
  
  //extracting the id of the checked item 
  const checkedItemId=req.body.checkbox;
  // extracting the listName
  const listName=req.body.listName;

  // if the listName is Today, we remove the item and redirect to the home route
  if(listName === "Today"){
    // removing the item
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted the checked item");
        res.redirect("/");
      }
    });
  } else{
    //listName is not "Today" but a different listName
    //in this array, we pull the element from Items array whose _id matches the id of the checked item, i.e.checkedId
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      // in the above query, we have 3 arguments
      // 1- conditions
      // 2- updates 
      // 3- callback
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

// custom lists
app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server has started successfully");
});
