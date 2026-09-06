import paramiko

hostname = '93.127.133.65'
port = 10078
username = 'administrator'
password = 'Cakestry@bmw1'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname, port=port, username=username, password=password)

cron_cmd = '(crontab -l 2>/dev/null | grep -v trigger-daily-report; echo "0 18 * * * cd /var/www/cakestry && npx tsx scripts/trigger-daily-report.ts >> /var/log/cakestry-daily-report.log 2>&1") | crontab -'

stdin, stdout, stderr = ssh.exec_command(cron_cmd)
stdout.channel.recv_exit_status()

stdin, stdout, stderr = ssh.exec_command('crontab -l')
print("Current VPS Crontab:")
print(stdout.read().decode('utf-8'))

ssh.close()
