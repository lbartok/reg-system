FROM webdevops/php-apache:7.0

RUN pecl install xdebug
RUN echo "zend_extension=/usr/local/lib/php/extensions/no-debug-non-zts-20151012/xdebug.so" > /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
RUN echo "pdo_mysql.default_socket=/var/run/mysqld/mysqld.sock" >> /opt/docker/etc/php/php.webdevops.ini



#RUN chown -R www-data:www-data /app
RUN usermod -aG root www-data
RUN usermod -aG root application

RUN export APACHE_RUN_USER=root
RUN export APACHE_RUN_GROUP=root

# ENV APACHE_RUN_USER root
# ENV APACHE_RUN_GROUP root

ENV APPLICATION_USER root
ENV APPLICATION_GROUP root
ENV CONTAINER_UID root

# RUN usermod -u 1000 www-data
# RUN groupmod -g 1000 www-data

VOLUME ["/app"]
# USER www-data

# ENV SERVICE_PHPFPM_OPTS ["-R"]
ENV SERVICE_PHPFPM_OPTS -R

RUN apt update
RUN groupadd -r mysql && useradd -r -g mysql mysql
ENV GOSU_VERSION 1.7


RUN set -x \
    && apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/* \
    && wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture)" \
    && wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture).asc" \
    && export GNUPGHOME="$(mktemp -d)" \
    && gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 \
    && gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu \
    && rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc \
    && chmod +x /usr/local/bin/gosu \
    && gosu nobody true \
    && apt-get purge -y --auto-remove ca-certificates wget

RUN mkdir /docker-entrypoint-initdb.d

# RUN apt-add-repository ppa:ondrej/php -y
RUN apt-get dist-upgrade -y
RUN apt-get autoclean -y
RUN apt-get autoremove -y
# RUN apt-get install php7.0
# RUN apt install php7.0-fpm php7.0-mysql -y
#RUN apt-get install php-imagick php7.0-intl -y

RUN apt-get update && apt-get install -y --no-install-recommends \
    pwgen \
    openssl \
    perl \
    && rm -rf /var/lib/apt/lists/*

RUN set -ex; \
    key='A4A9406876FCBD3C456770C88C718D3B5072E1F5'; \
    export GNUPGHOME="$(mktemp -d)"; \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
    gpg --export "$key" > /etc/apt/trusted.gpg.d/mysql.gpg; \
    rm -r "$GNUPGHOME"; \
    apt-key list > /dev/null


# ENV MYSQL_MAJOR 5.7
# ENV MYSQL_VERSION 5.7.20-1debian8
# ENV MYSQL_ROOT_PASSWORD root

# RUN mkdir /var/www/data/
# RUN mkdir /var/www/data/owncloud

# RUN echo "deb http://repo.mysql.com/apt/debian/ jessie mysql-${MYSQL_MAJOR}" > /etc/apt/sources.list.d/mysql.list

# MySQL
# RUN { \
#     echo mysql-community-server mysql-community-server/data-dir select ''; \
#     echo mysql-community-server mysql-community-server/root-pass password ''; \
#     echo mysql-community-server mysql-community-server/re-root-pass password ''; \
#     echo mysql-community-server mysql-community-server/remove-test-db select false; \
#     } | debconf-set-selections \
#     && apt-get update && apt-get install -y mysql-server="${MYSQL_VERSION}" && rm -rf /var/lib/apt/lists/* \
#     && rm -rf /var/lib/mysql && mkdir -p /var/lib/mysql /var/run/mysqld \
#     && chown -R mysql:mysql /var/lib/mysql /var/run/mysqld \
#     # ensure that /var/run/mysqld (used for socket and lock files) is writable regardless of the UID our mysqld instance ends up having at runtime
#     && chmod 777 /var/run/mysqld \
#     # comment out a few problematic configuration values
#     && find /etc/mysql/ -name '*.cnf' -print0 \
#     | xargs -0 grep -lZE '^(bind-address|log)' \
#     | xargs -rt -0 sed -Ei 's/^(bind-address|log)/#&/' \
#     # don't reverse lookup hostnames, they are usually another container
#     && echo '[mysqld]\nskip-host-cache\nskip-name-resolve' > /etc/mysql/conf.d/docker.cnf

# VOLUME /var/lib/mysql

COPY config/docker-entrypoint.sh /usr/local/bin/
#RUN ln -s usr/local/bin/docker-entrypoint.sh /entrypoint.sh # backwards compat

EXPOSE 9000
# EXPOSE 3306

# ENTRYPOINT ["docker-entrypoint.sh"]
# CMD ["mysqld"]
#COPY test/ /var/www/html/


