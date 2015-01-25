package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/googollee/go-socket.io"
)

var ioServer *socketio.Server

var houseUsers = map[string]string{
	"river": "thisisme",
}

var questions map[int]question

type question struct {
	mesage string
	answer chan bool
}

func init() {
	var err error
	ioServer, err = socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}

	questions = make(map[int]question)
}

func askBinaryQuestion(id int, message string, answer chan bool) {
	ioServer.BroadcastTo("authorised", "boolQuestion", id, message)
	questions[id] = question{message, answer}
}

func answerBinaryQuestion(id int, answer bool) {
	if q, ok := questions[id]; ok {
		q.answer <- answer
		delete(questions, id)
	}
}

func revokeBinaryQuestion(id int) {
	if q, ok := questions[id]; ok {
		close(q.answer)
	}
	delete(questions, id)
}

func StartHTTP(address string) {
	ioServer.On("connection", func(so socketio.Socket) {
		log.Println("New connection.")
		auth := false

		so.On("auth", func(user, password string) {
			if houseUsers[user] != password {
				so.Emit("authentication", false)
				return
			}

			auth = true
			so.Emit("authentication", true)
			so.Join("authorised")

			log.Printf("Pushing all devices to %s. Len devices: %d", user, len(devices))
			// push all current devices and all their data
			for _, device := range devices {
				device.PushToWeb()
			}

			return
		})

		so.On("boolAnswer", func(id int, answer bool) {
			if auth == false {
				return
			}
			answerBinaryQuestion(id, answer)
		})

		so.On("add_conditional", func(device, sensor, value, actuator, action string) {
			if auth == false {
				log.Println("Not authenticated for conditional")
				so.Emit("conditional_added", false)
				return
			}
			d := GetDevice(device)
			if d == nil {
				log.Println("Device %s not found for conditional", device)
				so.Emit("conditional_added", false)
				return
			}
			if s, ok := d.Sensors[sensor]; ok {
				s.addConditional(value, actuator, action)
				so.Emit("conditional_added", true)
				log.Println("Conditional added.")
				return
			}
			so.Emit("conditional_added", false)
			log.Println("Sensor %s not found for conditional", sensor)
		})

		so.On("action", func(uuid, action string) {
			if !auth {
				return
			}
			d := GetDevice(uuid)
			if d == nil {
				return
			}
			d.Action(action)
		})
	})

	ioServer.On("error", func(so socketio.Socket, err error) {
		log.Println("error:", err)
	})

	http.Handle("/socket.io/", ioServer)

	http.Handle("/", http.FileServer(http.Dir("./asset")))
	fmt.Printf("http listening on %s\n", address)
	go log.Fatal(http.ListenAndServe(address, nil))
}
