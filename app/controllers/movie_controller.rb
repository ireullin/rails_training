class MovieController < ApplicationController
	
	skip_before_action :verify_authenticity_token, only: [:update_schedules, :reserve_new, :reserve_delete]

	def index
		
		@new_movies = []
		MovieReserve.where('status = 1').each do |mr|
			#ms = MovieSchedules
			#	.select(:movie_id, :name)
			#	.join()
			#	.where( "name like ?", "%#{mr.keyword}%")
			#	.first
			
			ms = MovieSchedules.find_by_sql """
				select movie_id, name
				from movie_schedules
				where movie_id not in
				(
	    			select movie_id from movie_histories
	    			where enable = 1
				)
				and name like '%#{mr.keyword}%'
				limit 1
			"""

			next if ms[0].nil?

			mh = MovieHistories.find_or_create_by(movie_id: ms[0].movie_id)
			mh.name = ms[0].name
			mh.enable = 1
			mh.save
			
			@new_movies << ms[0].name 

			mr.status = 2
			mr.save
		end
		

		@schedules = MovieSchedules.select(:movie_id, :name)
		@movies = MovieHistories.where(enable: 1)
	end


	def schedule
		@schedule = MovieSchedules.where(movie_id: params[:id]).first
		respond_to {|format| format.html { render :schedule, layout: false } }
	end


	def reserve
		@data = MovieReserve.where('status <> 0')
		respond_to {|format| format.html { render :reserve, layout: false } }
	end


	def reserve_new
		rc = MovieReserve.new
		rc.tag_id = params[:tag_id]
		rc.keyword = params[:keyword]
		rc.status = 1
		rc.save

		respond_to {|format| format.json { render json: {table_id: rc.id, tag_id: rc.tag_id, method:  'reserve_new'} } }
	end


	def reserve_delete
		rc = MovieReserve.where(tag_id: params[:tag_id]).update_all(status: 0)
		respond_to {|format| format.json { render json: {tag_id: params[:tag_id], method: 'reserve_delete'} } }
	end


	def theater

		@theaters = MovieTheater.where(enable: 1)
		
		params[:id] = @theaters.first.id if params[:id].nil?

		theater = MovieTheater.find(params[:id])

		movie_schedules = MovieSchedules.where("schedules like ?", "%#{ theater.theater_name }%" )

		@result = {theater_name: theater.theater_name, movies: [] }
		movie_schedules.each do |s|

			rc = extract_theater(theater.theater_name, s.schedules)
			next if rc.nil?

			@result[:movies] << {
				id: s.movie_id,
				name: s.name,
				times: rc
			}

		end
	end


	def create
		@movie = MovieHistories.find_or_create_by(movie_id: params[:id])
		@movie.movie_id = params[:id]
		@movie.name = params[:name]
		@movie.enable = 1
		@movie.save

		respond_to {|format| format.any { render json: {msg: 'success', status: 0 } } }
	end


	def delete
		@movie = MovieHistories.find_or_create_by(movie_id: params[:id])
		@movie.movie_id = params[:id]
		@movie.name = params[:name]
		@movie.enable = 0
		@movie.save

		respond_to {|format| format.any { render json: {msg: 'success', status: 0 } } }
	end


	def update_schedules
		
		unless request.remote_ip == '127.0.0.1'
            respond_to {|format| format.json { render json: {msg: 'illegal ip', status: 1 } } }
            return false
        end

		obj = JSON.parse(params[:data])
		MovieSchedules.delete_all
		obj.each do | movie |
			row = MovieSchedules.new
			row.movie_id = movie['movie_id']
			row.name = movie['name']
			row.schedules = movie['theaters'].to_json
			row.created_at = Time.now.strftime("%Y-%m-%d %H:%M:%S")
			row.save
		end

		respond_to {|format| format.json { render json: {msg: 'success', status: 0 } } }
	end

	private
	def extract_theater(theater_name, schedule)
		
		return nil unless schedule.include?( theater_name )

		sch_obj = JSON.parse(schedule)
		sch_obj.each do |s|
			return s['times'] if s['theater'] == theater_name
		end

		return nil
	end

end
