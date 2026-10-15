// Contenido de la Ruta SOC Analyst: fases, herramientas, preguntas de repaso y glosario.
const phases = [
{id:'f1',n:'Fase 1',name:'Fundamentos',weeks:'4–5 semanas',
goal:`Entender cómo viaja la información por una red y cómo se ve un sistema desde adentro. Sin esto, todo lo demás se vuelve memorizar herramientas.`,
temas:[
{t:`Modelo TCP/IP: las cuatro capas`,c:`TCP/IP organiza la comunicación en capas. Cada capa agrega su propia cabecera a los datos que recibe de la de arriba, y el receptor las quita en orden inverso. Por eso un análisis de tráfico siempre empieza por identificar en qué capa estás mirando.`,p:[`<b>Acceso a red:</b> Ethernet y Wi-Fi. Usa direcciones MAC.`,`<b>Internet:</b> IP, que define origen y destino y decide la ruta. También usa ICMP (por ejemplo, el ping).`,`<b>Transporte:</b> TCP o UDP, con puertos para distinguir servicios.`,`<b>Aplicación:</b> HTTP, DNS, SSH, SMTP, los protocolos que usan las aplicaciones.`]},
{t:`Puertos y sockets`,c:`Un puerto es un número de 16 bits que identifica un servicio dentro de una máquina. Un socket es la combinación de IP, puerto y protocolo. Un puerto abierto es uno donde hay un servicio escuchando y aceptando conexiones, y eso es lo primero que busca un atacante.`,p:[`Puertos conocidos: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS, 445 SMB, 3306 MySQL, 3389 RDP.`,`En Linux, <code>ss -tulpn</code> lista los puertos en escucha y el proceso dueño de cada uno.`,`En Windows, <code>netstat -ano</code> hace lo mismo.`]},
{t:`TCP frente a UDP y el handshake`,c:`TCP es orientado a conexión: antes de enviar datos establece una sesión con un intercambio de tres pasos, y garantiza que los datos lleguen completos y en orden. UDP no establece conexión ni garantiza entrega, pero es más rápido. Se usa en DNS, DHCP, VoIP y streaming.`,p:[`Handshake: el cliente envía <b>SYN</b>, el servidor responde <b>SYN-ACK</b> y el cliente confirma con <b>ACK</b>.`,`Un escaneo SYN (<code>nmap -sS</code>) envía solo el primer paso para saber si un puerto responde, sin completar la sesión.`]},
{t:`DNS, HTTP y HTTPS`,c:`Cuando escribís una URL, primero el DNS traduce el nombre a una IP, después el navegador abre una conexión TCP y envía una petición HTTP. HTTPS es HTTP dentro de una capa TLS, que cifra el tráfico y autentica el servidor con un certificado.`,p:[`Registros DNS comunes: A (IPv4), AAAA (IPv6), MX (correo), TXT (verificaciones y políticas), CNAME (alias).`,`Métodos HTTP: GET para leer, POST para enviar datos, PUT y DELETE para modificar o borrar.`,`Códigos de estado: 2xx éxito, 3xx redirección, 4xx error del cliente (403, 404), 5xx error del servidor.`,`Herramientas para practicar: <code>nslookup dominio</code> y <code>curl -v https://dominio</code>.`]},
{t:`IP, máscaras y subredes`,c:`Una dirección IPv4 tiene 32 bits. La máscara indica cuántos bits pertenecen a la red y cuántos a los hosts. Para saber a qué red pertenece una IP, se aplica una operación AND entre la IP y la máscara.`,p:[`/24 significa 256 direcciones, de las cuales 254 son usables para hosts.`,`Ejemplo: 192.168.1.50/24 pertenece a la red 192.168.1.0, con broadcast 192.168.1.255.`,`Rangos privados: 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16.`]},
{t:`Windows: procesos, servicios y eventos`,c:`En Windows, casi toda la actividad deja rastro en el Visor de eventos. Revisar procesos y servicios te muestra qué corre en la máquina, y los eventos te dicen quién hizo qué y cuándo.`,p:[`Logs principales: <b>Security</b> (inicios de sesión), <b>System</b> (servicios y drivers), <b>Application</b> (aplicaciones).`,`Event IDs que vas a ver mucho: <b>4624</b> inicio de sesión exitoso, <b>4625</b> fallido, <b>4688</b> creación de proceso (si la auditoría está activa), <b>7045</b> servicio instalado.`,`Herramientas: <code>tasklist</code>, <code>sc query</code>, <code>services.msc</code>, <code>eventvwr.msc</code>.`]},
{t:`Linux: terminal, permisos y logs`,c:`La mayoría de servidores son Linux y casi todo se hace por terminal. Entender permisos y dónde están los logs es esencial para investigar cualquier incidente.`,p:[`Permisos: <code>rwx</code> para dueño, grupo y otros. <code>chmod 755</code> da control total al dueño y lectura y ejecución al resto.`,`Buscar texto en archivos: <code>grep</code>. Encadenar comandos: el pipe <code>|</code>.`,`Logs de autenticación: <code>/var/log/auth.log</code> en Debian y Ubuntu. Con systemd, <code>journalctl -u ssh</code>.`]}
],
labs:[
{t:`Montar dos máquinas virtuales`,pasos:[`Instalá VirtualBox o VMware en tu equipo.`,`Creá una VM con Ubuntu Desktop y otra con Windows 10 u 11 (usá una evaluación oficial de Microsoft).`,`Configurá ambas en red interna o en adaptador puente para que se vean entre sí; probá con <code>ping</code>.`]},
{t:`Capturar un ping y una petición HTTP en Wireshark`,pasos:[`Abrí Wireshark y seleccioná la interfaz de red activa.`,`Iniciá la captura y ejecutá <code>ping 8.8.8.8</code>. Identificá los paquetes ICMP.`,`Abrí una página HTTP de prueba (por ejemplo, <code>http://httpbin.org</code>) y filtrá con <code>http</code>. Mirá el método, el host y el código de respuesta.`]},
{t:`Escanear tu propia máquina con nmap`,pasos:[`Instalá nmap y consultá la IP de tu equipo con <code>ip a</code> o <code>ipconfig</code>.`,`Ejecutá <code>nmap -sV IP_DE_TU_EQUIPO</code>.`,`Compará el resultado con <code>ss -tulpn</code> o <code>netstat -ano</code>. ¿Coinciden los puertos abiertos?`]},
{t:`Revisar inicios de sesión en el Visor de eventos`,pasos:[`Abrí <code>eventvwr.msc</code> y entrá a Registros de Windows, Seguridad.`,`Filtrá por ID de evento 4624 y luego 4625.`,`Provocá un inicio fallido a propósito en la VM y buscá el evento 4625 correspondiente.`]},
{t:`Completar las salas de TryHackMe`,pasos:[`Creá una cuenta gratuita en tryhackme.com.`,`Completá "Pre Security" e "Introduction to Networking" en orden, con las tareas y preguntas de cada sala.`,`Anotá cada concepto nuevo en tu propio cuaderno de notas.`]}
],
recursos:[['TryHackMe','Salas Pre Security e Introduction to Networking','https://tryhackme.com'],['OverTheWire: Bandit','Práctica de terminal Linux desde cero','https://overthewire.org/wargames/bandit/'],['Wireshark','Documentación y guías de captura','https://www.wireshark.org/docs/']]},

{id:'f2',n:'Fase 2',name:'SOC Analyst',weeks:'6–8 semanas',
goal:`Aprender a detectar, clasificar y priorizar alertas, que es el trabajo diario de un analista de SOC.`,
temas:[
{t:`Qué es un SOC y sus niveles`,c:`Un Security Operations Center monitorea la seguridad de una organización, muchas veces las 24 horas. Su trabajo es recibir alertas de sus herramientas, decidir cuáles son reales y escalar lo que importa. Los niveles de analista se dividen según la profundidad del trabajo.`,p:[`<b>T1:</b> triage. Revisa las alertas, descarta lo evidentemente falso y escala lo sospechoso.`,`<b>T2:</b> investigación. Analiza en detalle los incidentes escalados.`,`<b>T3:</b> caza de amenazas e ingeniería de detección. Busca ataques que las alertas no cubren y crea nuevas reglas.`,`Herramientas típicas: SIEM, EDR (detección y respuesta en endpoints) e IDS/IPS (detección y prevención de intrusiones en red).`]},
{t:`SIEM: logs, reglas y correlación`,c:`Un SIEM recolecta logs de muchas fuentes, los normaliza en un formato común, los guarda y aplica reglas sobre ellos. La correlación es lo que convierte eventos sueltos en una alerta: un evento aislado puede ser normal, pero varios juntos no.`,p:[`Ejemplo de regla: más de 10 fallos de inicio de sesión desde la misma IP en 5 minutos.`,`Plataformas comunes: Splunk, Elastic Security, Wazuh y Microsoft Sentinel.`,`Calidad de una regla: cuántas alertas genera, cuántas son reales y qué contexto necesita para ser útil.`]},
{t:`Triage: verdaderos y falsos positivos`,c:`Cada alerta termina en una de cuatro categorías: verdadero positivo (ataque real), falso positivo (alerta sin amenaza), falso negativo (ataque no detectado) o positivo benigno (actividad real que es legítima pero disparó la regla). El triage es decidir cuál es cuál, con evidencia.`,p:[`Preguntas básicas: ¿qué pasó?, ¿quién lo hizo?, ¿desde dónde?, ¿es normal para ese activo?, ¿qué sigue?`,`Documentá siempre la decisión, incluso cuando cierres la alerta.`,`Escalá con contexto: qué viste, qué descartaste y qué falta por confirmar.`]},
{t:`MITRE ATT&CK`,c:`ATT&CK es una base de conocimiento pública con las tácticas (el objetivo del atacante) y las técnicas (cómo lo logra) observadas en ataques reales. Sirve para etiquetar alertas y para entender cobertura de detección.`,p:[`Tácticas: Initial Access, Execution, Persistence, Privilege Escalation, Lateral Movement, Exfiltration, entre otras.`,`Ejemplos de técnicas: T1566 Phishing, T1059 Command and Scripting Interpreter, T1110 Brute Force, T1078 Valid Accounts.`,`Cada técnica tiene un identificador (Txxxx) y subtécnicas (Txxxx.yyy).`]},
{t:`Análisis de phishing`,c:`Un correo de phishing busca que el usuario haga clic, descargue o entregue credenciales. Para analizarlo hay que mirar el remitente real, las cabeceras, los enlaces y los adjuntos, sin interactuar con ellos.`,p:[`En las cabeceras, revisá Return-Path, Reply-To y los resultados de SPF, DKIM y DMARC.`,`Los enlaces: pasá el cursor sin hacer clic y compará el dominio real con el que muestra el texto.`,`Adjuntos: no los abras en tu equipo. Calculá su hash SHA256 y consultalo en fuentes de inteligencia.`]},
{t:`Análisis de malware por comportamiento`,c:`En lugar de analizar el código de un archivo, observás qué hace al ejecutarse: procesos que crea, conexiones de red, cambios en el registro y mecanismos de persistencia. Siempre hacelo en una máquina virtual aislada, sin acceso a tu red.`,p:[`Herramientas: Process Monitor (Sysinternals) para archivos, registro y procesos.`,`Sandboxes en línea como ANY.RUN para ver el comportamiento sin ejecutar nada en tu equipo.`,`Señales de alerta: procesos que lanzan PowerShell, conexiones a IP directas y claves Run en el registro.`]},
{t:`Threat intelligence: IoC`,c:`Un IoC (indicador de compromiso) es una evidencia observable de un ataque: un hash, una IP, un dominio o una URL. Se consultan en fuentes públicas para saber si ya se asociaron a actividad maliciosa.`,p:[`Fuentes: VirusTotal, AbuseIPDB y AlienVault OTX.`,`Un IoC aislado no prueba nada. Contrastalo con el contexto del incidente.`,`Compartí IoC con el nivel de sensibilidad adecuado; el protocolo TLP (Traffic Light Protocol) define cómo.`]}
],
labs:[
{t:`Instalar Wazuh en una máquina virtual`,pasos:[`Usá una VM Ubuntu con al menos 8 GB de RAM y 4 vCPU.`,`Seguí la guía de instalación rápida de Wazuh (instalación todo en uno) de su documentación oficial.`,`Ingresá al panel web desde el navegador de tu equipo y revisá que el servidor esté activo.`]},
{t:`Enviar logs de Windows con Sysmon al SIEM`,pasos:[`Descargá Sysmon de Sysinternals e instalalo en la VM Windows con una configuración conocida, por ejemplo la de SwiftOnSecurity.`,`Instalá el agente de Wazuh en Windows y configurálo para enviar los logs de Sysmon.`,`Generá actividad (ejecutá un programa, creá un usuario) y confirmá que aparece en el panel.`]},
{t:`Crear una regla de detección simple`,pasos:[`Elegí un evento, por ejemplo varios 4625 seguidos desde la misma cuenta.`,`Escribí la regla en el formato de Wazuh con una frecuencia y un intervalo de tiempo.`,`Provocá el evento en la VM y verificá que la regla dispara una alerta.`]},
{t:`Analizar un PCAP de tráfico malicioso`,pasos:[`Descargá una muestra de malware-traffic-analysis.net dentro de tu VM aislada.`,`Abrí el PCAP en Wireshark y filtrá por <code>dns</code> y <code>http</code> para ver dominios y peticiones.`,`Anotá los IoC encontrados (dominios, IP, hashes) y consultalos en VirusTotal.`]},
{t:`Triage de cinco alertas`,pasos:[`Tomá cinco alertas de tu SIEM (o de un dataset de práctica).`,`Para cada una, respondé: ¿qué pasó?, ¿quién?, ¿desde dónde?, ¿es normal?`,`Decidí: cerrar como falso positivo o escalar, y escribí la justificación en una línea.`]}
],
recursos:[['TryHackMe','Ruta SOC Level 1','https://tryhackme.com'],['MITRE ATT&CK','Matriz de tácticas y técnicas','https://attack.mitre.org'],['Blue Team Labs Online','Desafíos de análisis de incidentes','https://blueteamlabs.online']]},

{id:'f3',n:'Fase 3',name:'Incident Response',weeks:'4–6 semanas',
goal:`Pasar de detectar a responder: contener el incidente, preservar la evidencia y documentar lo que pasó.`,
temas:[
{t:`Ciclo de respuesta del NIST SP 800-61`,c:`La guía NIST SP 800-61 es el marco de referencia para manejar incidentes. Define cuatro fases que se repiten: lo que hacés antes del incidente, lo que hacés durante él y lo que aprendés después.`,p:[`<b>Preparación:</b> políticas, herramientas, contactos y playbooks listos antes de que pase algo.`,`<b>Detección y análisis:</b> confirmar que es un incidente, determinar alcance y severidad.`,`<b>Contención, erradicación y recuperación:</b> frenar el daño, eliminar al atacante y volver a operar de forma segura.`,`<b>Actividad posterior:</b> lecciones aprendidas e informe final.`]},
{t:`Contención`,c:`Contener es limitar el daño sin destruir la evidencia. A veces conviene aislar el equipo de la red pero no apagarlo, porque la memoria RAM se pierde al apagar y allí puede estar el malware.`,p:[`Contención de corto plazo: aislar el host, bloquear una IP o deshabilitar una cuenta comprometida.`,`Contención de largo plazo: parchar, cambiar credenciales y reforzar la configuración mientras se opera en modo limpio.`,`Documentá cada acción con hora y responsable.`]},
{t:`Cadena de custodia y preservación`,c:`La evidencia digital tiene que poder demostrarse íntegra y sin alteraciones. La cadena de custodia registra quién la recolectó, cuándo, cómo y quién la tuvo después.`,p:[`Calculá el hash (SHA256) de cada evidencia al recolectarla y guardalo en el registro.`,`Trabajá siempre sobre copias forenses, nunca sobre el original.`,`Registrá cada transferencia de la evidencia con fecha, hora y firma.`]},
{t:`Forense de memoria con Volatility`,c:`La memoria RAM contiene procesos, conexiones de red y módulos cargados que a veces no quedan en disco. Volatility es el framework estándar para analizar volcados de memoria.`,p:[`En Volatility 3 se usan plugins, por ejemplo <code>windows.pslist</code> para procesos y <code>windows.netscan</code> para conexiones.`,`Buscá procesos con nombres parecidos a los legítimos, procesos hijos inesperados y conexiones a IP externas.`]},
{t:`Artefactos de Windows`,c:`Windows guarda rastros de ejecución y persistencia en varios lugares. Conocerlos te permite reconstruir qué se ejecutó aunque el atacante haya borrado el archivo.`,p:[`<b>Prefetch</b> (carpeta C:\\Windows\\Prefetch): registra programas ejecutados.`,`<b>Amcache:</b> registro de aplicaciones ejecutadas e instaladas.`,`<b>Claves Run</b> del registro (por ejemplo HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run): persistencia clásica.`]},
{t:`Línea de tiempo de eventos`,c:`Una línea de tiempo ordena los eventos del incidente para contar qué pasó primero y qué vino después. Es la base del informe.`,p:[`Normalizá todas las marcas de tiempo a UTC antes de comparar. Un desfase horario confunde todo el caso.`,`Herramientas: Plaso (log2timeline) para generar la línea de tiempo y Timeline Explorer para revisarla.`]},
{t:`Redacción de informes de incidente`,c:`El informe tiene que ser entendible para alguien sin conocimientos técnicos y, a la vez, dar a un equipo técnico lo necesario para reproducir el análisis.`,p:[`Resumen ejecutivo: qué pasó, impacto y estado actual.`,`Cronología, alcance, causa raíz y sistemas afectados.`,`IoC, acciones tomadas y recomendaciones concretas.`]}
],
labs:[
{t:`Analizar una imagen de memoria con Volatility`,pasos:[`Descargá una imagen de memoria de práctica (por ejemplo, de los ejercicios de Volatility o de DFIR Madness).`,`Identificá el perfil o el sistema con <code>windows.info</code>.`,`Revisá procesos con <code>windows.pslist</code> y conexiones con <code>windows.netscan</code>. Anotá lo que te parezca sospechoso.`]},
{t:`Resolver un caso de ransomware simulado`,pasos:[`Abrí la sala de ransomware de TryHackMe, dentro de la ruta de Incident Handling.`,`Para cada tarea, escribí qué evidencia usaste y por qué.`,`Al final, redactá un resumen de dos párrafos con la cronología del ataque.`]},
{t:`Reconstruir una línea de tiempo`,pasos:[`Tomá los logs de la VM Windows comprometida (o de un dataset de práctica).`,`Generá la línea de tiempo con Plaso o extraé los eventos clave a mano en un CSV.`,`Ordenala por fecha UTC e identificá el primer evento sospechoso.`]},
{t:`Escribir un informe de incidente de una página`,pasos:[`Usá la estructura: resumen ejecutivo, cronología, alcance, causa raíz, IoC y acciones.`,`Escribilo como si lo leyera un gerente y después revisalo como si fueras el equipo técnico.`,`Guardalo como PDF y agregalo a tu portafolio.`]}
],
recursos:[['NIST SP 800-61','Guía de manejo de incidentes','https://csrc.nist.gov'],['Volatility Foundation','Framework de forense de memoria','https://volatilityfoundation.org'],['TryHackMe','Ruta de Incident Handling','https://tryhackme.com']]},

{id:'f4',n:'Fase 4',name:'Pentesting intro',weeks:'6–8 semanas',
goal:`Atacar lo que aprendiste a defender, en entornos autorizados, para entender cómo piensa el atacante.`,
temas:[
{t:`Metodología de un pentest`,c:`Un pentest sigue fases en orden. Cada fase alimenta a la siguiente: lo que encontrás en el reconocimiento define por dónde escaneás, y lo que encontrás al escanear define qué intentás explotar.`,p:[`<b>Reconocimiento:</b> pasivo (información pública) y activo (interacción con el objetivo).`,`<b>Escaneo y enumeración:</b> puertos, servicios, versiones y usuarios.`,`<b>Explotación:</b> aprovechar una vulnerabilidad para obtener acceso.`,`<b>Post-explotación:</b> evaluar qué tanto alcance tiene el acceso, sin salirse del alcance.`,`<b>Reporte:</b> documentar hallazgos, riesgo y remediación.`]},
{t:`Alcance y reglas de enfrentamiento`,c:`Antes de tocar cualquier sistema tiene que existir una autorización por escrito que defina qué IP, dominios y horarios están permitidos. Sin eso, es un ataque, aunque tu intención sea buena.`,p:[`Define alcance: direcciones, dominios y exclusiones explícitas.`,`Define horario y contacto de emergencia en caso de que algo se caiga.`,`Si encontrás algo fuera del alcance, paralizá y consultá antes de seguir.`]},
{t:`Nmap avanzado`,c:`Nmap es el escáner de red estándar. Más allá del escaneo básico de puertos, sirve para identificar versiones de servicios y ejecutar scripts de detección.`,p:[`<code>-p-</code> escanea todos los puertos (65535).`,`<code>-sV</code> detecta la versión de los servicios; <code>-sC</code> ejecuta scripts por defecto.`,`<code>-oA nombre</code> guarda la salida en varios formatos. Ejemplo: <code>nmap -sC -sV -oA escaneo IP</code>.`]},
{t:`OWASP Top 10 (2021)`,c:`El OWASP Top 10 es la lista de riesgos más frecuentes en aplicaciones web. Es el punto de partida para cualquier prueba web.`,p:[`A01 Control de acceso roto. A02 Fallas criptográficas. A03 Inyección.`,`A04 Diseño inseguro. A05 Configuración de seguridad incorrecta. A06 Componentes vulnerables.`,`A07 Fallas de identificación y autenticación. A08 Fallas de integridad de software y datos.`,`A09 Fallas de registro y monitoreo. A10 Server-Side Request Forgery (SSRF).`]},
{t:`Escalada de privilegios básica`,c:`Muchas veces entrás con un usuario sin privilegios y necesitás llegar a root o a Administrador. Buscar configuraciones mal hechas es casi siempre más rápido que explotar un error.`,p:[`Linux: <code>sudo -l</code> para ver qué puede ejecutar el usuario; <code>find / -perm -4000</code> para buscar binarios SUID.`,`Linux: revisá tareas programadas (cron) con permisos de escritura.`,`Windows: <code>whoami /priv</code> para ver privilegios; revisá servicios con rutas sin comillas.`]},
{t:`Metasploit en un entorno controlado`,c:`Metasploit es un framework que agrupa módulos de exploits, payloads y auxiliares. Úsalo para entender cómo funciona un exploit conocido, no como caja negra.`,p:[`Flujo básico: <code>search</code>, <code>use</code>, <code>show options</code>, <code>set RHOSTS</code>, <code>run</code>.`,`Leé la descripción y las referencias del módulo antes de ejecutarlo.`,`Usalo solo contra máquinas de laboratorio.`]},
{t:`Reportes de pentest`,c:`El reporte es el entregable real de un pentest. Un hallazgo sin evidencia y sin remediación no sirve para nadie.`,p:[`Cada hallazgo: título, severidad (puedes usar CVSS), descripción, evidencia (captura y comando), impacto y remediación.`,`Ordená los hallazgos por severidad y agregá un resumen ejecutivo al inicio.`]}
],
labs:[
{t:`Completar la ruta Starting Point de HackTheBox`,pasos:[`Creá una cuenta gratuita en hackthebox.com y conectá la VPN que te indique la plataforma.`,`Seguí las máquinas de Starting Point en orden, leyendo cada tarea antes de buscar la respuesta.`,`Para cada máquina anotá: servicio expuesto, vulnerabilidad y cómo se explotó.`]},
{t:`Completar máquinas fáciles en TryHackMe`,pasos:[`Elegí máquinas marcadas como Easy dentro de la ruta de pentesting de TryHackMe.`,`Antes de buscar una respuesta, intentá enumerar tú mismo con nmap y los servicios que encuentres.`,`Cuando la resuelvas, reescribí los pasos en tu cuaderno para poder repetirlos sin ayuda.`]},
{t:`Resolver los retos de OWASP Juice Shop en local`,pasos:[`Instalá Juice Shop con Docker: <code>docker run -p 3000:3000 bkimminich/juice-shop</code>.`,`Entrá a http://localhost:3000 desde tu VM o equipo de práctica.`,`Empezá por los retos de categoría "Injection" y "Broken Access Control".`]},
{t:`Laboratorios de PortSwigger sobre inyección SQL y XSS`,pasos:[`Creá una cuenta gratuita en PortSwigger Web Security Academy.`,`Completá primero los laboratorios de inyección SQL y después los de XSS.`,`Por cada laboratorio anotá qué parámetro era vulnerable y por qué.`]},
{t:`Escribir un reporte completo de una máquina resuelta`,pasos:[`Elegí una máquina que hayas resuelto y documentá el reconocimiento, el escaneo y la explotación.`,`Incluí evidencia de cada paso y una recomendación de remediación.`,`Revisalo como si fueras el cliente: ¿entendés el riesgo sin conocer el ataque?`]}
],
recursos:[['HackTheBox','Starting Point y máquinas retiradas','https://www.hackthebox.com'],['PortSwigger Web Security Academy','Laboratorios gratuitos de seguridad web','https://portswigger.net/web-security'],['OWASP Juice Shop','Aplicación vulnerable para practicar','https://owasp.org/www-project-juice-shop/']]}
];

// Herramientas por fase: [nombre, para qué sirve, enlace oficial, tipo de fuente]
const HERRAMIENTAS = {
f1:[
['VirtualBox','Virtualizar las máquinas de laboratorio (Ubuntu y Windows).','https://www.virtualbox.org/wiki/Downloads','Sitio oficial'],
['Ubuntu Desktop','Sistema Linux para practicar terminal y logs.','https://ubuntu.com/download/desktop','Sitio oficial'],
['Windows 10/11 Enterprise (evaluación)','Máquina Windows para el Visor de eventos y Sysmon.','https://www.microsoft.com/evalcenter','Microsoft'],
['Wireshark','Captura y análisis de tráfico de red.','https://www.wireshark.org/download.html','Sitio oficial'],
['Nmap','Escaneo de puertos y detección de servicios.','https://nmap.org/download','Sitio oficial'],
['Sysinternals Suite','Process Explorer, Autoruns, Process Monitor y más.','https://learn.microsoft.com/sysinternals/downloads/sysinternals-suite','Microsoft Learn'],
['OverTheWire','Retos de terminal Linux para practicar desde cero.','https://overthewire.org/wargames/bandit/','Sitio oficial']
],
f2:[
['Wazuh','SIEM y EDR de código abierto para la práctica de detección.','https://documentation.wazuh.com','Documentación oficial'],
['Wazuh en GitHub','Código fuente y releases de Wazuh.','https://github.com/wazuh/wazuh','Repositorio GitHub'],
['Elastic Stack','Alternativa de SIEM con Elasticsearch, Kibana y Beats.','https://www.elastic.co/downloads','Sitio oficial'],
['Sysmon','Registro detallado de procesos, red y archivos en Windows.','https://learn.microsoft.com/sysinternals/downloads/sysmon','Microsoft Learn'],
['sysmon-config (SwiftOnSecurity)','Configuración base de Sysmon para empezar.','https://github.com/SwiftOnSecurity/sysmon-config','Repositorio GitHub'],
['Sigma','Reglas de detección genéricas, portables entre SIEM.','https://github.com/SigmaHQ/sigma','Repositorio GitHub'],
['MITRE ATT&CK Navigator','Visualizar técnicas y cobertura de detección.','https://mitre-attack.github.io/attack-navigator/','Sitio oficial'],
['VirusTotal','Consulta de hashes, URLs, IP y dominios.','https://www.virustotal.com','Sitio oficial'],
['ANY.RUN','Sandbox interactivo en línea para ver comportamiento de malware.','https://any.run','Sitio oficial'],
['AbuseIPDB','Reputación de direcciones IP reportadas.','https://www.abuseipdb.com','Sitio oficial'],
['AlienVault OTX','Intercambio de inteligencia de amenazas (IoC).','https://otx.alienvault.com','Sitio oficial'],
['Malware Traffic Analysis','Ejercicios con capturas PCAP de malware real.','https://www.malware-traffic-analysis.net','Sitio de práctica']
],
f3:[
['Volatility 3','Análisis de volcados de memoria RAM.','https://github.com/volatilityfoundation/volatility3','Repositorio GitHub'],
['Plaso (log2timeline)','Generación de líneas de tiempo a partir de logs y artefactos.','https://github.com/log2timeline/plaso','Repositorio GitHub'],
['Herramientas de Eric Zimmerman','Parsers de artefactos de Windows y Timeline Explorer.','https://ericzimmerman.github.io','Sitio del autor'],
['Autopsy','Plataforma forense de código abierto con interfaz gráfica.','https://www.autopsy.com/download/','Sitio oficial'],
['FTK Imager','Crear imágenes forenses de discos y memoria.','https://www.exterro.com/digital-forensics-software/ftk-imager','Sitio oficial'],
['Autoruns','Listado de programas que se inician con el sistema (persistencia).','https://learn.microsoft.com/sysinternals/downloads/autoruns','Microsoft Learn'],
['CyberChef','Decodificar y transformar datos sospechosos.','https://gchq.github.io/CyberChef','Sitio oficial'],
['DFIR Madness','Casos de práctica de análisis forense.','https://www.dfirmadness.com','Sitio del autor']
],
f4:[
['Kali Linux','Distribución con herramientas de pentesting preinstaladas.','https://www.kali.org/get-kali/','Sitio oficial'],
['Metasploit Framework','Framework de explotación y módulos auxiliares.','https://github.com/rapid7/metasploit-framework','Repositorio GitHub'],
['Burp Suite Community','Proxy para analizar y modificar tráfico web.','https://portswigger.net/burp/communitydownload','Sitio oficial'],
['OWASP ZAP','Escáner de seguridad para aplicaciones web.','https://www.zaproxy.org/download/','Sitio oficial'],
['OWASP Juice Shop','Aplicación web vulnerable para practicar.','https://github.com/juice-shop/juice-shop','Repositorio GitHub'],
['DVWA','Aplicación web vulnerable clásica para practicar.','https://github.com/digininja/DVWA','Repositorio GitHub'],
['PEASS-ng (LinPEAS / WinPEAS)','Enumeración automatizada para escalada de privilegios.','https://github.com/peass-ng/PEASS-ng','Repositorio GitHub'],
['GTFOBins','Binarios de Linux mal configurados que permiten escalar privilegios.','https://gtfobins.github.io','Sitio del proyecto'],
['PayloadsAllTheThings','Referencia de payloads y técnicas por vulnerabilidad.','https://github.com/swisskyrepo/PayloadsAllTheThings','Repositorio GitHub'],
['SecLists','Listas de palabras y payloads para pruebas.','https://github.com/danielmiessler/SecLists','Repositorio GitHub'],
['Docker Desktop','Para levantar Juice Shop y otros laboratorios locales.','https://www.docker.com/products/docker-desktop/','Sitio oficial']
]
};

// Preguntas de repaso por tema: [pregunta, respuesta]
const quizzes = {
'f1-t-0':[[`¿En qué capa del modelo TCP/IP trabaja HTTP?`,`En la capa de Aplicación.`],[`¿En qué capa opera IP y qué protocolo usa el ping?`,`En la capa de Internet. El ping usa ICMP.`]],
'f1-t-1':[[`¿Qué servicio suele escuchar en el puerto 22?`,`SSH.`],[`¿Qué diferencia hay entre un puerto abierto y uno cerrado?`,`Un puerto abierto tiene un servicio escuchando y aceptando conexiones. En un puerto cerrado nadie escucha o la conexión se rechaza.`]],
'f1-t-2':[[`¿Cuáles son los tres pasos del handshake de TCP?`,`SYN, SYN-ACK y ACK.`],[`¿Por qué DNS suele usar UDP?`,`Sus consultas son cortas y necesitan respuesta rápida, sin sesión. Si no llega la respuesta, el cliente reintenta.`]],
'f1-t-3':[[`¿Qué registro DNS traduce un nombre a IPv4?`,`El registro A.`],[`¿Qué significa un código de estado 403?`,`Prohibido: el servidor recibió la petición pero no la autoriza. El 404 significa que el recurso no existe.`]],
'f1-t-4':[[`¿Cuántas direcciones usables tiene una red /24?`,`254.`],[`¿A qué red pertenece 10.1.2.30/24?`,`A la red 10.1.2.0.`]],
'f1-t-5':[[`¿Qué Event ID corresponde a un inicio de sesión fallido?`,`4625.`],[`¿En qué log buscarías la instalación de un servicio?`,`En System, con el Event ID 7045.`]],
'f1-t-6':[[`¿Qué permisos da chmod 755?`,`Lectura, escritura y ejecución al dueño; lectura y ejecución al grupo y a otros.`],[`¿Qué comando muestra los logs de un servicio de systemd?`,`journalctl -u nombre_del_servicio.`]],
'f2-t-0':[[`¿Qué hace un analista de nivel T1?`,`Triage: revisa las alertas, descarta las falsas y escala las sospechosas.`],[`¿Qué herramienta detecta actividad en los endpoints?`,`EDR.`]],
'f2-t-1':[[`¿Qué es la correlación en un SIEM?`,`Combinar eventos relacionados para generar una alerta con sentido.`],[`Da un ejemplo de regla de detección.`,`Más de varios fallos de inicio de sesión desde la misma IP en poco tiempo.`]],
'f2-t-2':[[`Un ataque real que la alerta no detectó es un:`,`Falso negativo.`],[`Actividad legítima que disparó la regla es un:`,`Positivo benigno.`]],
'f2-t-3':[[`¿Cuál es la diferencia entre táctica y técnica en ATT&CK?`,`La táctica es el objetivo del atacante; la técnica es el método que usa para lograrlo.`],[`¿Qué técnica corresponde a la fuerza bruta?`,`T1110 Brute Force.`]],
'f2-t-4':[[`¿Qué registros de autenticación del correo revisás?`,`SPF, DKIM y DMARC.`],[`¿Qué hacés con un adjunto sospechoso?`,`No lo abrís en tu equipo. Calculás su hash SHA256 y lo consultás en fuentes de inteligencia.`]],
'f2-t-5':[[`¿Dónde se analiza el comportamiento de un malware?`,`En una máquina virtual aislada o en un sandbox.`],[`¿Qué clave del registro suele usarse para persistencia?`,`Run (por ejemplo, en HKCU o HKLM).`]],
'f2-t-6':[[`¿Qué es un IoC?`,`Una evidencia observable de un ataque: un hash, una IP, un dominio o una URL.`],[`¿Por qué un IoC aislado no alcanza para concluir algo?`,`Sin contexto puede ser legítimo o compartido por muchos servicios.`]],
'f3-t-0':[[`¿Cuáles son las cuatro fases del NIST SP 800-61?`,`Preparación; detección y análisis; contención, erradicación y recuperación; actividad posterior.`],[`¿En qué fase se escriben las lecciones aprendidas?`,`En la actividad posterior al incidente.`]],
'f3-t-1':[[`¿Por qué no conviene apagar un equipo comprometido de inmediato?`,`Porque se pierde la memoria RAM, donde puede haber evidencia.`],[`Un ejemplo de contención de corto plazo:`,`Aislar el host de la red.`]],
'f3-t-2':[[`¿Para qué se calcula el hash SHA256 de una evidencia?`,`Para demostrar que no fue alterada.`],[`¿Sobre qué copia se trabaja?`,`Sobre una copia forense, nunca sobre el original.`]],
'f3-t-3':[[`¿Qué plugin de Volatility 3 lista procesos?`,`windows.pslist.`],[`¿Qué plugin muestra conexiones de red?`,`windows.netscan.`]],
'f3-t-4':[[`¿Qué carpeta registra los programas ejecutados?`,`Prefetch (C:\\Windows\\Prefetch).`],[`¿Qué clave del registro revisás para persistencia?`,`Run (HKCU o HKLM, dentro de CurrentVersion).`]],
'f3-t-5':[[`¿A qué zona horaria se normalizan las marcas de tiempo?`,`UTC.`],[`¿Qué herramienta genera líneas de tiempo a partir de logs?`,`Plaso (log2timeline).`]],
'f3-t-6':[[`¿Qué sección del informe está pensada para la gerencia?`,`El resumen ejecutivo.`],[`¿Qué explica la causa raíz?`,`El origen del incidente y cómo ingresó el atacante.`]],
'f4-t-0':[[`¿Qué fase viene después de la enumeración?`,`La explotación.`],[`¿Qué documento define el alcance del pentest?`,`La autorización escrita y las reglas de enfrentamiento.`]],
'f4-t-1':[[`¿Qué hacés si encontrás algo fuera del alcance?`,`Detenerte y consultar antes de seguir.`],[`¿Por qué es indispensable la autorización por escrito?`,`Sin ella, la prueba es un ataque y tiene consecuencias legales.`]],
'f4-t-2':[[`¿Qué hace la opción -p- en nmap?`,`Escanea todos los puertos (65535).`],[`¿Qué hace la opción -sV?`,`Detecta la versión de los servicios.`]],
'f4-t-3':[[`¿En qué categoría del OWASP Top 10 está la inyección?`,`A03.`],[`¿Qué es SSRF en esa lista?`,`A10, Server-Side Request Forgery.`]],
'f4-t-4':[[`¿Qué comando muestra qué puede ejecutar el usuario con sudo?`,`sudo -l.`],[`¿Qué busca find / -perm -4000?`,`Binarios con el bit SUID activo.`]],
'f4-t-5':[[`¿Qué comando selecciona un módulo en Metasploit?`,`use.`],[`¿Por qué leer el módulo antes de ejecutarlo?`,`Para entender qué hace, qué requiere y qué riesgos tiene.`]],
'f4-t-6':[[`¿Qué elementos debe tener cada hallazgo?`,`Título, severidad, descripción, evidencia, impacto y remediación.`],[`¿Por qué ordenar los hallazgos por severidad?`,`Para priorizar la remediación.`]]
};

const GLOSARIO = [
{cat:'Redes',items:[
['IP','Dirección que identifica una máquina en la red.'],
['MAC','Dirección física de una tarjeta de red.'],
['Puerto','Número que identifica un servicio dentro de una máquina.'],
['TCP / UDP','Protocolos de transporte. TCP es confiable y orientado a conexión; UDP es más rápido y sin garantías.'],
['ICMP','Protocolo de diagnóstico que usa el ping.'],
['DNS','Traduce nombres de dominio a direcciones IP.'],
['HTTP / HTTPS','Protocolos de la web. HTTPS es HTTP cifrado con TLS.'],
['TLS','Protocolo que cifra la comunicación y autentica el servidor con un certificado.'],
['Subred / máscara','Definen qué direcciones IP pertenecen a la misma red (por ejemplo, /24).'],
['SYN, SYN-ACK, ACK','Los tres pasos del handshake de TCP.']
]},
{cat:'Operaciones de seguridad (SOC)',items:[
['SOC','Security Operations Center: equipo que monitorea y responde a amenazas.'],
['SIEM','Plataforma que recolecta, correlaciona y analiza logs (Splunk, Wazuh, Elastic).'],
['EDR','Detección y respuesta en endpoints, es decir, equipos individuales.'],
['IDS / IPS','Detección y prevención de intrusiones en la red.'],
['Log','Registro de eventos generado por sistemas y aplicaciones.'],
['Alerta','Notificación que genera una regla cuando detecta algo sospechoso.'],
['Triage','Clasificar y priorizar alertas antes de investigarlas.'],
['Falso positivo','Alerta que indica una amenaza que en realidad no existe.'],
['Falso negativo','Ataque real que no generó alerta.'],
['Positivo benigno','Actividad legítima que disparó una alerta.'],
['Correlación','Combinar eventos para detectar un patrón.'],
['Sysmon','Herramienta de Microsoft que registra actividad detallada en Windows.']
]},
{cat:'Amenazas e inteligencia',items:[
['IoC','Indicador de compromiso: hash, IP, dominio o URL asociada a un ataque.'],
['MITRE ATT&CK','Base de datos pública de tácticas y técnicas de atacantes.'],
['Táctica','Objetivo del atacante, por ejemplo persistencia.'],
['Técnica','Método para lograr un objetivo; tiene código tipo T1566.'],
['Phishing','Engaño para obtener credenciales o que la víctima ejecute algo.'],
['Malware','Software malicioso: virus, troyanos, ransomware, etc.'],
['Ransomware','Malware que cifra archivos y pide un rescate.'],
['Persistencia','Mecanismo que permite al atacante mantener acceso tras un reinicio.'],
['SPF, DKIM, DMARC','Registros que validan que un correo realmente viene del dominio que dice.'],
['Hash (SHA256)','Huella digital de un archivo; si el archivo cambia, el hash cambia.'],
['TLP','Protocolo que define con quién se puede compartir información de amenazas.'],
['Sandbox','Entorno aislado para ejecutar un archivo sin riesgo para tu red.']
]},
{cat:'Respuesta a incidentes y forense',items:[
['Incidente','Evento que compromete o amenaza la seguridad de un sistema.'],
['Contención','Limitar el daño de un incidente.'],
['Erradicación','Eliminar la causa del incidente, por ejemplo el malware.'],
['Recuperación','Volver a operar de forma segura.'],
['Cadena de custodia','Registro de quién manejó la evidencia y cuándo.'],
['Copia forense','Copia exacta de un disco o memoria para analizar sin alterar el original.'],
['RAM / volcado de memoria','Contenido de la memoria en un momento dado; sirve para encontrar procesos y conexiones.'],
['Línea de tiempo (timeline)','Secuencia ordenada de eventos de un incidente.'],
['Prefetch, Amcache','Artefactos de Windows que registran programas ejecutados.'],
['NIST SP 800-61','Guía del NIST para manejo de incidentes.']
]},
{cat:'Pentesting',items:[
['Pentest','Prueba autorizada para encontrar y explotar vulnerabilidades.'],
['Red team','Simulación de ataques más realista y amplia que un pentest.'],
['Reconocimiento','Recolectar información del objetivo antes de atacar.'],
['Enumeración','Obtener detalles de servicios, usuarios y recursos.'],
['Explotación','Aprovechar una vulnerabilidad para obtener acceso.'],
['Escalada de privilegios','Pasar de un usuario limitado a uno con más permisos (root o Administrador).'],
['Post-explotación','Acciones dentro de un sistema ya comprometido, siempre dentro del alcance.'],
['Payload','Código que se ejecuta una vez explotada la vulnerabilidad.'],
['Alcance (scope)','Lo que está autorizado a probar.'],
['RoE','Rules of Engagement: reglas de enfrentamiento, horarios, límites y contactos.'],
['CVE','Identificador público de una vulnerabilidad conocida.'],
['CVSS','Escala de 0 a 10 para medir la severidad de una vulnerabilidad.'],
['OWASP Top 10','Lista de los riesgos más comunes en aplicaciones web.'],
['SQLi','Inyección SQL: consultas maliciosas insertadas en un campo de entrada.'],
['XSS','Inyección de scripts en páginas web vistas por otros usuarios.'],
['SSRF','Hacer que el servidor haga peticiones a destinos internos no previstos.'],
['SUID','Permiso de Linux que ejecuta un programa con los privilegios de su dueño.']
]},
{cat:'Herramientas',items:[
['Wireshark','Analizador de tráfico de red.'],
['Nmap','Escáner de puertos y servicios.'],
['Volatility','Análisis de memoria RAM.'],
['Metasploit','Framework con módulos de explotación.'],
['VirusTotal','Consulta de hashes, URLs y dominios contra múltiples motores de detección.'],
['Process Monitor','Registra archivos, registro y procesos en Windows.']
]}
];
