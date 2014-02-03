(function($) {

  window.Player = Backbone.Model.extend({
    defaults: {
      currentAlbumIndex: 0,
      currentTrackIndex: 0,
      state: 'stop'
    },
    initialize: function() {
      this.playlist = new Playlist();
    },
    play: function() {
      this.set({state: 'play'});
    },
    pause: function() {
      this.set({state: 'pause'});
    },
    isPlaying: function() {
      return (this.get('state') == 'play');
    },
    isStopped: function() {
      return (!this.isPlaying());
    },
    currentAlbum: function() {
      return this.playlist.at(this.get('currentAlbumIndex'));
    },
    currentTrackUrl: function() {
      var album = this.currentAlbum();
      return album.trackUrlAtIndex(this.get('currentTrackIndex'));
    },
    logCurrentAlbumAndTrack: function() {
      console.log('Player ' + this.get('currentAlbumIndex') + ':' + this.get('currentTrackIndex'), this);
    }
  });

  window.Album = Backbone.Model.extend({
    isFirstTrack: function(index) {
      return index == 0;
    },
    isLastTrack: function(index) {
      return index >= this.get('tracks').length - 1;
    },
    trackUrlAtIndex: function(index) {
      if (this.get('tracks').length >= index) {
        return this.get('tracks')[index].url;
      }
      return null;
    }
  });

  window.Albums = Backbone.Collection.extend({
    model: Album,
    url: '/albums'
  });

  window.Playlist = Albums.extend({
    isFirstAlbum: function(index) {
      return (index == 0);
    },
    isLastAlbum: function(index) {
      return (index >= (this.models.length - 1));
    }
  });

  window.library = new Albums();
  window.player = new Player();

  window.AlbumView = Backbone.View.extend({
    tagName: 'li',
    className: 'album',
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#album-template').html());
    },
    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });

  window.LibraryAlbumView = AlbumView.extend({
    events: {
      'click .queue.add': 'select'
    },
    select: function(e) {
      this.collection.trigger('select', this.model);
      console.log('triggered select', this.model);
    }
  });

  window.PlaylistAlbumView = AlbumView.extend({});

  window.PlaylistView = Backbone.View.extend({
    tagName: 'section',
    className: 'playlist',
    initialize: function() {
      _.bindAll(this, 'render');
      this.template = _.template($('#playlist-template').html());
      this.collection.bind('reset', this.render);
      this.player = this.options.player;
      this.library = this.options.library;
    },
    render: function() {
      $(this.el).html(this.template(this.player.toJSON()));
      this.$('button.play').toggle(this.player.isStopped());
      this.$('button.pause').toggle(this.player.isPlaying());
      return this;
    }
  });

  window.LibraryView = Backbone.View.extend({
    tagName: 'section',
    className: 'library',
    initialize: function() {
      _.bindAll(this, 'render');
      this.template = _.template($('#library-template').html());
      this.collection.bind('reset', this.render);
    },
    render: function() {
      var $albums,
        collection = this.collection;
      $(this.el).html(this.template());
      $albums = this.$('.albums');
      collection.each(function(album) {
        var view = new LibraryAlbumView({
          model: album,
          collection: collection
        });
        $albums.append(view.render().el);
      });
      return this;
    }
  });

  window.BackboneTunes = Backbone.Router.extend({
    routes: {
      '': 'home',
      'blank': 'blank'
    },
    initialize: function() {
      this.playlistView = new PlaylistView({
        collection: window.player.playlist,
        player: window.player,
        library: window.library
      });

      this.libraryView = new LibraryView({
        collection: window.library
      });
    },
    home: function() {
      var $container = $('#container');
      $container.empty();
      $container.append(this.playlistView.render().el);
      $container.append(this.libraryView.render().el);
    },
    blank: function() {
      $('#container').empty();
      $('#container').text('blank');
    }
  });

  $(function() {
    window.App = new BackboneTunes();
    Backbone.history.start({ pushState: true });
  });

})(jQuery);
