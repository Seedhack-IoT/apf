package main

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"os"
	"strings"

	"golang.org/x/crypto/ssh"
)

const (
	DataChannel = "apf_data"
)

var userStore map[string][]byte

func init() {
	userStore = make(map[string][]byte)
}

func StartSSH(address string) {
	//	reader := bufio.NewReader(os.Stdin)

	var q int
	// Create SSH public key authentication method, with delayed validation.
	config := &ssh.ServerConfig{
		PublicKeyCallback: func(conn ssh.ConnMetadata, key ssh.PublicKey) (*ssh.Permissions, error) {
			user := conn.User()
			log.Printf("Authentication request from user %s.", user)
			if conn.User() == "mani" {
				return nil, nil
			}
			mk := key.Marshal()
			if pk, ok := userStore[user]; ok != false {
				if string(pk) == string(mk) {
					return nil, nil
				}
			} else {
				q++
				answerChan := make(chan bool)
				askBinaryQuestion(q, fmt.Sprintf("Do you want to connect %s?", user), answerChan)
				if <-answerChan {
					userStore[user] = mk
					return nil, nil
				}
				// await on terminal for input:0
				//				fmt.Printf("Accept connection from user %s? y/n: ", user)
				//				input, _ := reader.ReadString('\n')
				//				if len(input) >= 1 && input[0] == 'y' {
				//					userStore[user] = mk
				//					return nil, nil
				//				}
			}
			fmt.Printf("Access denied for user %s\n", user)
			// otherwise reject
			return nil, fmt.Errorf("Access denied.")
		},
		PasswordCallback: func(conn ssh.ConnMetadata, password []byte) (*ssh.Permissions, error) {
			if conn.User() == "some_user" {
				return nil, nil
			}
			return nil, fmt.Errorf("wrong password")
		},
	}

	// You can generate a keypair with 'ssh-keygen -t rsa'
	privateBytes, err := ioutil.ReadFile("keys/key")
	if err != nil {
		log.Fatal("Failed to load private key (./key/key)")
	}

	private, err := ssh.ParsePrivateKey(privateBytes)
	if err != nil {
		log.Fatal("Failed to parse private key")
	}

	config.AddHostKey(private)

	// Once a ServerConfig has been configured, connections can be accepted.
	listener, err := net.Listen("tcp", address)
	if err != nil {
		log.Fatalf("Failed to listen on %s (%s)", address, err)
	}

	// Accept all connections
	log.Printf("Listening on %s...", address)
	for {
		tcpConn, err := listener.Accept()
		if err != nil {
			log.Printf("Failed to accept incoming connection (%s)", err)
			continue
		}
		log.Println("TCP connection", tcpConn)
		// Before use, a handshake must be performed on the incoming net.Conn.
		sshConn, chans, reqs, err := ssh.NewServerConn(tcpConn, config)
		if err != nil {
			log.Printf("Failed to handshake (%s)", err)
			continue
		}

		log.Printf("New SSH connection from %s (%s)", sshConn.RemoteAddr(), sshConn.ClientVersion())
		// Discard all global out-of-band Requests
		go handleRequests(reqs)
		// Accept all channels
		go handleChannels(chans)
	}
}

func handleRequests(requests <-chan *ssh.Request) {
	for req := range requests {
		log.Printf("Recieved out-of-band request: %+v", req)
	}
}

func handleChannels(chans <-chan ssh.NewChannel) {
	// Service the incoming Channel channel.
	for newChannel := range chans {
		if t := newChannel.ChannelType(); t == "session" {
			// for shell debugging
			channel, requests, err := newChannel.Accept()
			if err != nil {
				log.Printf("Could not accept channel (%s)", err)
				continue
			}
			handleChannel(channel, requests)
		} else if t == DataChannel {
			log.Printf("Accepting a DataChannel...")
			channel, requests, err := newChannel.Accept()
			if err != nil {
				log.Printf("Error accepting custom channel (%s)", err)
				continue
			}
			customChannel(channel, requests)
		} else {
			newChannel.Reject(ssh.UnknownChannelType, fmt.Sprintf("unknown channel type: %s", t))
			continue
		}
	}
}

func customChannel(channel ssh.Channel, requests <-chan *ssh.Request) {
	go func(in <-chan *ssh.Request) {
		for req := range in {
			log.Println("Handling a request...")
			req.Reply(false, nil)
		}
	}(requests)
	_, err := channel.Write([]byte("this is some data i'm sending"))
	if err != nil {
		fmt.Println("Error sending data", err)
	}
	reader := bufio.NewReader(channel)
	termR := bufio.NewReader(os.Stdin)
	go func() {
		for {
			line, err := termR.ReadString('\n')
			if err != nil || len(line) == 0 {
				return
			}
			fmt.Printf("Sending \"%s\"....", line)
			nr, err := channel.Write([]byte(line))
			fmt.Printf("Sent %d bytes.\n", nr)
			if err != nil {
				fmt.Printf("Sending error (%s)\n", err)
			}
		}
	}()
	go func() {
		defer channel.Close()
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				break
			}
			fmt.Printf("INPUT: %s\n", line)
		}
	}()

}

// in this function we have an SSH connection.
func handleChannel(channel ssh.Channel, requests <-chan *ssh.Request) {
	// prepare teardown function
	//	close := func() {
	//		channel.Close()
	//		log.Printf("Session closed")
	//	}

	go func(in <-chan *ssh.Request) {
		for req := range in {
			ok := false
			switch req.Type {
			case "shell":
				ok = true
				if len(req.Payload) > 0 {
					ok = false
				}
			}
			req.Reply(ok, nil)
		}
	}(requests)

	reader := bufio.NewReader(channel)
	go func() {
		defer channel.Close()
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				log.Printf("error reading. (%s)", err)
				break
			}
			b, err := channel.Write([]byte(strings.ToUpper(line)))
			if err != nil {
				log.Printf("Error writing (%s)", err)
			}
			fmt.Printf("INPUT: %s\n", line)
			log.Printf("Write %d bytes.", b)
		}
	}()
}
