#!/usr/bin/env python3
import sys
import os
import pty
import select
import struct
import fcntl
import termios
import argparse

def set_winsize(fd, rows, cols):
    try:
        winsize = struct.pack("HHHH", int(rows), int(cols), 0, 0)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)
    except Exception:
        pass

def main():
    parser = argparse.ArgumentParser(description="Python PTY Bridge for Termius Agent")
    parser.add_argument("--cwd", default=os.path.expanduser("~"), help="Working directory")
    parser.add_argument("--cols", type=int, default=80, help="Initial terminal columns")
    parser.add_argument("--rows", type=int, default=24, help="Initial terminal rows")
    parser.add_argument("--cmd", default="/bin/bash", help="Shell or command to execute")
    parser.add_argument("--args", nargs="*", default=[], help="Command arguments")
    args = parser.parse_args()

    pid, master_fd = pty.fork()

    if pid == 0:
        # Child process inside pseudo-terminal
        try:
            if os.path.exists(args.cwd):
                os.chdir(args.cwd)
        except Exception:
            pass

        os.environ["TERM"] = "xterm-256color"
        os.environ["COLORTERM"] = "truecolor"

        cmd_list = [args.cmd] + args.args
        try:
            os.execvp(args.cmd, cmd_list)
        except Exception as e:
            sys.stderr.write(f"Failed to execute {args.cmd}: {e}\n")
            sys.exit(1)
    else:
        # Parent process bridges stdin/stdout to master_fd
        set_winsize(master_fd, args.rows, args.cols)
        stdin_fd = sys.stdin.fileno()

        buffer = b""
        running = True

        while running:
            try:
                rlist, _, _ = select.select([master_fd, stdin_fd], [], [], 0.05)
            except (KeyboardInterrupt, select.error):
                break

            for fd in rlist:
                if fd == master_fd:
                    # Output from terminal process to stdout
                    try:
                        data = os.read(master_fd, 4096)
                        if not data:
                            running = False
                            break
                        sys.stdout.buffer.write(data)
                        sys.stdout.buffer.flush()
                    except OSError:
                        running = False
                        break

                elif fd == stdin_fd:
                    # Input from Node/WebSocket to terminal process
                    try:
                        data = os.read(stdin_fd, 4096)
                        if not data:
                            running = False
                            break

                        # Check for resize protocol marker: __RESIZE__ cols rows\n
                        buffer += data
                        while b"\n" in buffer:
                            line, buffer = buffer.split(b"\n", 1)
                            if line.startswith(b"__RESIZE__ "):
                                parts = line.decode("utf-8", errors="ignore").split()
                                if len(parts) >= 3:
                                    cols, rows = int(parts[1]), int(parts[2])
                                    set_winsize(master_fd, rows, cols)
                            else:
                                # Normal input ending in newline
                                os.write(master_fd, line + b"\n")

                        # If there's partial data not ending with newline, check if it's the start of resize
                        if buffer and not buffer.startswith(b"__RESIZE__"):
                            os.write(master_fd, buffer)
                            buffer = b""

                    except OSError:
                        running = False
                        break

        try:
            os.close(master_fd)
        except Exception:
            pass

if __name__ == "__main__":
    main()
