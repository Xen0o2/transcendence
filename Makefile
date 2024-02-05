# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: tunsinge <thibaut.unsinger@gmail.com>      +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/02/05 18:11:54 by tunsinge          #+#    #+#              #
#    Updated: 2024/02/05 18:11:54 by tunsinge         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

start:
	@echo "Starting Transcendence"
	@docker compose up -d
	@echo "Transcendence started"

stop:
	@echo "Stopping Transcendence"
	@docker compose down
	@echo "Transcendence stopped"

up: start
down: stop

clean: stop
	@echo "Cleaning Transcendence"
	@docker system prune -af
	@docker volume prune -f --filter all=1
	@echo "Transcendence cleaned"

.PHONY: start stop up down
