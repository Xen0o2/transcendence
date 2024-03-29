# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: tunsinge <thibaut.unsinger@gmail.com>      +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/02/05 18:11:54 by tunsinge          #+#    #+#              #
#    Updated: 2024/03/01 13:39:38 by tunsinge         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

all: start

start: setip
ifneq (,$(wildcard ./Back-end/.env))
	@echo "Starting Transcendence"
	@docker compose up -d --build
	@echo "Transcendence started"
else
	@echo ".env is missing for the Back-end can't build up Transcendence"
endif

stop:
	@echo "Stopping Transcendence"
	@docker compose down
	@echo "Transcendence stopped"

up: start
down: stop

setip:
	@echo "Setting ip address in the files"
	@bash setipadr.sh

clean: stop
	@echo "Cleaning Transcendence"
	@docker system prune -af
	@docker volume prune -f --filter all=1
	@echo "Transcendence cleaned"

re: clean start

.PHONY: all start stop up down re
