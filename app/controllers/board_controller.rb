class BoardController < ApplicationController
  def new
    @user = User.logged_in(session)
    redirect_to '/login/entrance' and return unless @user and @user.is_confirmed
    return unless @user.is_confirmed and @user.can_edit_boards
    name = params['name']
    if name and name =~ /\S/
      board = Board.new(name: name)
      board.save!
      event = Post.new(
        post_type: Post::BOARD_CREATION,
        board: board.id,
        reference: board.id,
        owner: @user.id,
        content: board.name
      )
      event.save!
      board.last_event = event.id
      board.save!
      redirect_to '/main/board?board=' + board.id.to_s
    else
      redirect_to '/main/board'
    end
  end
  def edit
    @user = User.logged_in(session)
    redirect_to '/login/entrance' and return unless @user and @user.is_confirmed
    redirect_to '/main/settings' and return unless @user.can_edit_boards
    board = Board.find_by_id(params['id'])
    if board
      if params['do'] == 'change'
        name = params['name']
        if name and name =~ /\S/ and name != board.name
          oldname = board.name
          board.name = name
          event = Post.new(
            post_type: Post::BOARD_RENAMING,
            board: board.id,
            reference: board.id,
            owner: @user.id,
            content: oldname + "\n" + board.name
          )
          event.save!
          board.last_event = event.id
          board.save!
        end
        order = params['order']
        if order and order != board.order
          board.order = order
          event = Post.new(
            post_type: Post::BOARD_REORDERING,
            board: board.id,
            reference: board.id,
            owner: @user.id,
            content: board.name
          )
          event.save!
          board.last_event = event.id
          board.save!
        end
      elsif params['do'] == 'delete'
         # Deletion of boards is NYI
      end
    end
    redirect_to '/main/settings'
  end
end
