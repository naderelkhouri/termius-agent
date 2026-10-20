#!/usr/bin/env python3
import sys
import os
import pty
import select
import struct
import fcntl
import termios
import argparse
import signal
import time

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

        def cleanup_child(signum=None, frame=None):
            nonlocal running
            running = False
            try:
                # Envia SIGHUP e SIGTERM para todo o grupo de processos do terminal
                try:
                    pgid = os.getpgid(pid)
                    os.killpg(pgid, signal.SIGHUP)
                    os.killpg(pgid, signal.SIGTERM)
                except Exception:
                    try:
                        os.kill(pid, signal.SIGHUP)
                        os.kill(pid, signal.SIGTERM)
                    except Exception:
                        pass
                # Fecha o master_fd do PTY
                try:
                    os.close(master_fd)
                except Exception:
                    pass
            finally:
                sys.exit(0)

        # Captura sinais de término do Node ou do sistema
        signal.signal(signal.SIGTERM, cleanup_child)
        signal.signal(signal.SIGHUP, cleanup_child)
        signal.signal(signal.SIGINT, cleanup_child)

        # Check for optional dedicated control fd (fd 3) passed from Node.js
        control_fd = 3
        has_control_fd = False
        try:
            os.fstat(control_fd)
            has_control_fd = True
        except OSError:
            has_control_fd = False

        buffer = b""
        ctrl_buffer = b""
        running = True

        while running:
            try:
                watch_fds = [master_fd, stdin_fd]
                if has_control_fd:
                    watch_fds.append(control_fd)
                rlist, _, _ = select.select(watch_fds, [], [], 0.05)
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

                        if has_control_fd:
                            # Dedicated control fd is active; stdin is pure raw input stream
                            os.write(master_fd, data)
                        else:
                            # Fallback check for resize marker: __RESIZE__ cols rows\n
                            buffer += data
                            while b"\n" in buffer:
                                line, buffer = buffer.split(b"\n", 1)
                                if line.startswith(b"__RESIZE__ "):
                                    parts = line.decode("utf-8", errors="ignore").split()
                                    if len(parts) >= 3:
                                        cols, rows = int(parts[1]), int(parts[2])
                                        set_winsize(master_fd, rows, cols)
                                else:
                                    os.write(master_fd, line + b"\n")

                            if buffer and not buffer.startswith(b"__RESIZE__"):
                                os.write(master_fd, buffer)
                                buffer = b""
                    except OSError:
                        running = False
                        break

                elif fd == control_fd:
                    # Out-of-band resize signals
                    try:
                        cdata = os.read(control_fd, 1024)
                        if not cdata:
                            has_control_fd = False
                        else:
                            ctrl_buffer += cdata
                            while b"\n" in ctrl_buffer:
                                cline, ctrl_buffer = ctrl_buffer.split(b"\n", 1)
                                parts = cline.decode("utf-8", errors="ignore").replace("__RESIZE__", "").split()
                                if len(parts) >= 2:
                                    try:
                                        c_cols, c_rows = int(parts[0]), int(parts[1])
                                        set_winsize(master_fd, c_rows, c_cols)
                                    except ValueError:
                                        pass
                    except OSError:
                        has_control_fd = False

        cleanup_child()

if __name__ == "__main__":
    main()
