"use strict";

// Виджет размещается на window и называется WTable
// Представляет собой функцию конструктор, которая принимает в качестве аргументов
//    element - DOM элемент с html кодом виджета на странице
//    files – массив файлов

window.WTable = function (element, files) {

    // Свойства каждого экземпляра объекта
    //    files - массив файлов
    //    sortBy – является свойством объекта File, свойство по которому будут отсортированы объекты
    //    vector – направление сортировки (Boolean)

    var properties = {
        files: [],
        sortBy: 'name',
        vector: true
    };

    // Если при создание объекту передаться список файлов,
    // этот список будет скопирован в свойства объекта

    if (files) {
        for (var i in files) {
            properties.files[i] = files[i];
        }
    }

    // Переменные объекта:
    //    this_, prototype_ - cсылки на объект, на его прототип
    //    label – каждый экземпляр объекта маркируется, для того чтобы отличать экземпляры друг от друга
    //    remove - флаг указывающий на то, что из свойств объекта должен быть удалён файл
    //    serialNumber - индекс удаляемого файла в массиве с файлами
    //    filesElement, fileElement, addElement, inputElement - DOM элементы виджета

    var this_ = this,
        prototype_   = window.WTable.prototype,
        label        = Math.random().toString(),
        remove       = false,
        serialNumber = null,
        filesElement = element.getElementsByClassName('w-table__files')[0],
        fileElement  = element.getElementsByClassName('w-table__file')[0],
        addElement   = element.getElementsByClassName('w-table__add')[0],
        inputElement = element.getElementsByClassName('w-table__input')[0];

    // prototype.fileTemplate - прототипное свойство в котором хранится DOM элемент,
    // представляющий собой шаблон для визуализации списка файлов.
    // В процессе визуализации данные будет интерполированы в шаблон.
    // Аналогом является директива ng-repeat в AngularJS

    !prototype_.fileTemplate && (prototype_.fileTemplate = fileElement);
    filesElement.removeChild(fileElement);

    // inputFile - функция, которая будет вызвана при добавлении файла, через поле input

    function inputFile(event) {

        // Добавление файла в свойства объекта и визуализация изменений
        //    prototype.pushFile - Метод добавляющий файл в свойства объекта,
        //    если файл добавлен возвращает true, иначе false
        //    prototype.sort - Метод сортировки массива с файлами
        //    prototype.clear - Метод отчистки DOM элемента с отрендеренными файлами
        //    prototype.render - Метод визуализации файлов

        if (this_.pushFile(event.target.files[0], properties)) {
            this_.sort(properties);
            this_.clear(filesElement);
            this_.render(filesElement, properties);
        }

        // После добавление файла, отчистка поля файла

        inputElement.removeEventListener('change', inputFile);
        addElement.innerHTML = addElement.innerHTML;
        inputElement = element.getElementsByClassName('w-table__input')[0];
        inputElement.addEventListener('change', inputFile, false);
    }

    // Регистрация обработчиков событий

    inputElement.addEventListener('change', inputFile, false);

    element.addEventListener('dragstart', function (event) {

        // Для перетаскивания файлов между виджетами используется прототипное свойство
        // prototype.fileBuffer, в которое передается ссылка на объект файла.
        // В event.dataTransfer добавляются свойства
        // file – флаг перетаскивания файла,
        // label – маркировка экземпляра объекта

        event.dataTransfer.setData('file', true);
        event.dataTransfer.setData('label', label);
        prototype_.fileBuffer = properties.files[event.target.serialNumber];

        serialNumber = event.target.serialNumber;

    }, false);
    element.addEventListener('dragover', function (event) {
        event.preventDefault();

        // При перетаскивании в области виджета, флаг,
        // указывающий на удаление одного из файлов в свойствах объекта,
        // принимает ложное значение

        remove = false;

    }, false);
    element.addEventListener('dragleave', function (event) {
        event.preventDefault();

        // При перетаскивании за пределы виджета, устанавливаем флаг, указывающий на то,
        // что из свойств объекта должен быть удалён файл

        remove = true;

    }, false);
    element.addEventListener('dragend', function (event) {
        event.preventDefault();

        // remove file
        // Удаление файла из свойств объекта при завершении перетаскивания

        if ((remove && serialNumber) !== null &&
            (prototype_.fileBuffer || prototype_.fileBuffer === null) &&
            (prototype_.fileBuffer !== true)) {

            // Удаление объекта файла из свойств

            properties.files.splice(serialNumber, 1);

            // Вызов метод отчистки и визуализации

            this_.clear(filesElement);
            this_.render(filesElement, properties);
        }

        remove = false;
        serialNumber = null;
        prototype_.fileBuffer = null;

    }, false);
    element.addEventListener('drop', function (event) {
        event.preventDefault();

        // Событие drop не должно срабатывать, если перетаскивание происходить в рамках самого виджета.
        // Для проверки этого используется свойство label

        if(event.dataTransfer.getData('label') === label) {
            prototype_.fileBuffer = true;
            return false;
        }

        // Далее обработка происходить только если в событие присутствует файл
        // или указатель на то что файл содержится в буфере

        if (event.dataTransfer.files[0] || event.dataTransfer.getData('file')) {

            // Если присутствует файл вызывается метод добавления файла

            if (event.dataTransfer.files[0]) {
                this_.pushFile(event.dataTransfer.files[0], properties);
            }

            // Если присутствует указатель на то, что файл содержится в буфере,
            // происходить попытка добавить файл к свойствам объекта, если добавление происходит,
            // буфер обнуляется, если нет принимает значение true

            if (event.dataTransfer.getData('file')) {
                if (this_.pushFile(prototype_.fileBuffer, properties)) {
                    prototype_.fileBuffer = null;
                } else {
                    prototype_.fileBuffer = true;
                }
            }

            // Вызов метод сортировки, отчистки и визуализации

            this_.sort(properties);
            this_.clear(filesElement);
            this_.render(filesElement, properties);

        }

    }, false);

    // Функция сортирующие массив объектов файлов в свойствах объекта. Принимает в качестве аргументов:
    // sortBy – название свойства, по которому должна проводиться сортировка,
    // vector – направление сортировки

    function sort(sortBy, vector) {

        // Установка новых значений в свойства объекта

        properties.sortBy = sortBy;
        properties.vector = vector;

        // Вызов метод сортировки, отчистки и визуализации

        this_.sort(properties);
        this_.clear(filesElement, properties);
        this_.render(filesElement, properties);
    }

    // События click, назначаемые на элементы заголовка таблице с файлами,
    // сортирующие список файлов

    element
        .getElementsByClassName('w-table__btn_name')[0]
        .addEventListener('click', function () {
            this.vector === undefined && (this.vector = true);
            this.vector = !this.vector;

            sort('name', this.vector);
        }, false);

    element
        .getElementsByClassName('w-table__btn_size')[0]
        .addEventListener('click', function () {
            this.vector = !this.vector;

            sort('size', this.vector);

        }, false);

    element
        .getElementsByClassName('w-table__btn_date')[0]
        .addEventListener('click', function () {
            this.vector = !this.vector;

            sort('lastModified', this.vector);
        }, false);


    // Метод serialize возвращает массив файлов из свойств объекта

    this.serialize = function () {
        return properties.files;
    };

    // В завершении работы функции конструктора выполняются методы
    // сортировки списка файла и визуализации списка файлов

    this_.sort(properties);
    this_.render(filesElement, properties);

};
window.WTable.prototype.pushFile = function (file, properties) {

    function in_(element) {
        return element.lastModified === file.lastModified && element.name === file.name && element.size === file.size;
    }

    if (!properties.files.some(in_)) {
        properties.files.push(file);
        return true;
    } else {
        setTimeout(function () {
            alert('Already contains file');
        }, 1);
        return false;
    }
};
window.WTable.prototype.sort = function (properties) {
    properties.files.sort(function (a, b) {
        return properties.vector ? a[properties.sortBy] > b[properties.sortBy] : a[properties.sortBy] < b[properties.sortBy];
    });
};
window.WTable.prototype.render = function (filesElement, properties) {

    if (this.fileTemplate) {

        for (var c = 0; c < properties.files.length; c++) {

            var element = this.fileTemplate.cloneNode(true);

            for (var i in element.childNodes) {
                if (element.childNodes[i].nodeType === 1) {

                    // Интерполяция данных из объекта файла на шаблон

                    element.childNodes[i].innerHTML =
                        element.childNodes[i]
                            .innerHTML
                            .replace(/\{\{(.+)\}\}/g, function () {
                                return properties.files[c][arguments[1]];
                            });

                    // Каждый DOM элемент маркируется индексом,
                    // который указывает на ее место в массиве объектов файлов

                    element.serialNumber = c;

                    // Вставка элемента файла на страницу

                    filesElement.appendChild(element);
                }
            }

        }

    }

};
window.WTable.prototype.clear = function (filesElement) {
    filesElement.innerHTML = '';
};
window.WTable.prototype.fileTemplate = null;
window.WTable.prototype.fileBuffer = null;

document.addEventListener('DOMContentLoaded', function () {

    var elements = document.getElementsByClassName('w-table');

    for (var c = 0; c < elements.length; c++) {
        new WTable(elements[c]);
    }

    // testing
    // elements = document.getElementsByClassName('w-table');
    // a = new WTable(elements[0])
    // b = new WTable(elements[1], a.serialize())

}, false);
