class RemoveLimitFromPostContent < ActiveRecord::Migration
  def up
    change_column :posts, :content, :text, limit: nil
  end

  def down
    change_column :posts, :content, :text, limit: 255
  end
end
