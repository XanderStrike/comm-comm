class TopicController < ApplicationController
  def new
    @current_user = User.logged_in(session)
    if @current_user
      if @current_user.is_confirmed and @current_user.can_edit_topics
        name = params['name']
        if name and name =~ /\S/
          topic = Topic.new(name: name)
          topic.save!
          Post.create(
            post_type: Post::TOPIC_CREATION,
            topic: topic.id,
            reference: topic.id,
            owner: @current_user,
            content: topic.name
          )
        end
      end
      redirect_to '/main/settings'
    else
      redirect_to '/login/entrance'
    end
  end
  def edit
    @current_user = User.logged_in(session)
    if @current_user
      if @current_user.is_confirmed and @current_user.can_edit_topics
        topic = Topic.find_by_id(params['id'])
        if topic
          name = params['name']
          if name and name =~ /\S/
            oldname = topic.name
            topic.name = name
            topic.save!
            Post.create(
              post_type: Post::TOPIC_RENAMING,
              topic: topic.id,
              reference: topic.id,
              owner: @current_user,
              content: oldname + "\n" + topic.name
            )
          end
        end
      end
      redirect_to '/main/settings'
    else
      redirect_to '/login/entrance'
    end
  end
end
