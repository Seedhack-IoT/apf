package main

import (
	"bufio"
	"golang.org/x/crypto/ssh"
	"log"
	"os"
)

func main() {
	config := &ssh.ClientConfig{
		User: "some_user",
		Auth: []ssh.AuthMethod{
			ssh.Password("yourpassword"),
		},
	}
	client, err := ssh.Dial("tcp", "localhost:2200", config)
	if err != nil {
		panic("Failed to dial: " + err.Error())
	}

	// Each ClientConn can support multiple interactive sessions,
	// represented by a Session.
	channel, reqChan, err := client.OpenChannel("apf_data", nil)
	if err != nil {
		panic("Failed to create channel: " + err.Error())
	}
	defer channel.Close()

	// ignore requests
	go func() {
		for req := range reqChan {
			req.Reply(false, nil)
		}
	}()

	log.Println("You're now connected and a channel is created.")
	reader := bufio.NewReader(os.Stdin)
	listener := bufio.NewReader(channel)
	go func() {
		for {
			line, err := listener.ReadString('\n')
			if err != nil {
				log.Printf("Error reading from channel: %s", err)
				break
			}
			log.Printf("Received text: \"%s\".", line)
		}
	}()
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			log.Printf("Error on reading stdin (%s)", err)
		}
		b, err := channel.Write([]byte(line))
		if err != nil {
			log.Printf("Error writing on channel (%s).", err)
		}
		log.Printf("Wrote %d bytes.", b)
	}
}
