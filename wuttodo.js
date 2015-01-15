var Lists = new Mongo.Collection('lists');
var Tasks = new Mongo.Collection('todos');
var HistoryList = new Mongo.Collection('history');
var id;
Router.route('/privacy', function(){
  this.render('privacy');
});
Router.route('/', function(){
  this.render('newList');
});
Router.route('/:listId', function(){
  id = this.params.listId;
  if(Session.get('newList')){
  Meteor.setTimeout(function(){
    alert('This is your new Todo list! It is accesible without authentication via this specific URL. ' + 
        'Do not lose this URL! Go ahead and bookmark it now.');
        }, 500);
  Session.set('newList', false);
  }
  Session.set('listId', this.params.listId);
  this.render('todoList');
});
if(Meteor.isClient){
  function generateListId(){
    return Math.random().toString(36).slice(2).substring(0,5);
  }
  Template.newList.events({
    'click #newListButton': function(){
      var listId;
      listId = generateListId();
      Meteor.call('createNewList', listId);
      Session.set('newList', true);
      Router.go('/' + listId);
    },
  }); 
  Template.todoList.events({
    'click .deleteList': function(event){
      var cancel = confirm("Are you sure you want to delete this list? There's no going back!");
      if(!cancel){
        event.preventDefault();
      } else {
        Meteor.call('deleteList', id);
      }
    },
    'change .hideComplete': function(event){
      Session.set("hideComplete", event.target.checked);
    },
    'click .newListLink': function(event){
      var cancel = confirm('Did you bookmark this page? Do so if you want to keep this to-do list!');
      if(!cancel){
        event.preventDefault();
      }
    },
    'submit .newTodo': function(event){
      var text = event.target.text.value;
      Tasks.insert({
        listId: Session.get('listId'),
        text: text,
        createdAt: new Date(),
        complete: false  
      });
      event.target.text.value = "";
      return false;
    },  
  });
  Template.todoList.helpers({
    entries: function(){
      if(Session.get('hideComplete')){
        return Tasks.find({listId: Session.get('listId'), complete: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({listId: Session.get('listId')}, {sort: {createdAt: -1}});
      }
    }
  });
  Template.entry.events({
    'click .todoDelete': function(){
      HistoryList.insert(this);
      Tasks.remove(this._id);
    },
    'click .todoComplete': function(event){
      Tasks.update(this._id, {$set: {complete: ! this.complete}});
      if(!this.complete){
        $('.goodjob').show().fadeOut(500);
      }
    }  
  });
  Template.entry.helpers({
    createdAt: function(){
      return moment(this.createdAt).fromNow();
    }
  });
  Template.stats.helpers({
    completedRemoved: function(){
      var number = HistoryList.find({listId: id, complete: true}).fetch();
      return number.length;
    },
    justRemoved: function(){
      var number = HistoryList.find({listId: id, complete: false}).fetch();
      return number.length;
    }
  })
}
Meteor.methods({
  createNewList: function(listId){
    Lists.insert({listId: listId, name: 'Todo List'});
  },
  deleteList: function(id){
    Lists.remove({listId: id});
    Tasks.remove({listId: id});
    HistoryList.remove({listId: id});
  }
});
