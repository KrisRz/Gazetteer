# Use an official PHP runtime as a parent image
FROM php:8.1-apache

# Enable mod_rewrite for pretty URLs
RUN a2enmod rewrite

# Copy project files into the container
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
