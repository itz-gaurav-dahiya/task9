const express = require('express');
const app = express();
const fs = require('fs');
const uuid = require('uuid');

app.use(express.json());

// Middleware for handling CORS
app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// const port = 2410;
var port =process.env.PORT||2410;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

let { data } = require('./data.js');
let fname = 'data1.json';

// Reset data endpoint
app.get('/srv/resetData', function (req, res) {
    let newData = JSON.stringify(data);
    fs.writeFileSync(fname, newData);
    res.send('Data in file is reset');
});

// Get shops endpoint
app.get('/shops', function(req, res) {
    fs.readFile(fname, 'utf-8', function(err, fileData) {
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }

        try {
            let dataObj = JSON.parse(fileData);
            let shopsArray = dataObj.shops;
            res.send(shopsArray);
        } catch (parseError) {
            console.log(parseError);
            return res.status(500).send("Error parsing data file");
        }
    });
});

// Add shop endpoint
app.post('/shops', async (req, res) => {
    const { name, rent } = req.body;

    if (!name || !rent) {
        return res.status(400).send("Name and rent are required fields.");
    } else {
        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let shopdata = dataObj.shops;

                if (!Array.isArray(shopdata)) {
                    shopdata = [];
                }

                const shopid = uuid.v4();
                shopdata.push({ shopid, name, rent });

                // Preserve existing products and other data
                const newData = { ...dataObj, shops: shopdata };

                fs.writeFile(fname, JSON.stringify(newData), 'utf-8', function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Internal Server Error");
                    }
                    res.status(200).send("Shop added successfully");
                });
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    }
});


app.get('/products', function(req, res) {
    fs.readFile(fname, 'utf-8', function(err, result) {
        if (err) {
            return res.status(500).send(err.message);
        }

        try {
            const products = JSON.parse(result).products;
            // res.json(products);
            res.send(products)
        } catch (parseError) {
            console.log(parseError);
            res.status(500).send("Error parsing data file");
        }
    });
});

app.get('/products/:id', function(req, res) {
    fs.readFile(fname, 'utf-8', function(err, result) {
        if (err) {
            return res.status(500).send(err.message);
        }

        try {
            const productId = req.params.id;
            const products = JSON.parse(result).products;

            if (productId) {
                const product = products.find(product => product.productid == productId);

                if (product) {
                    res.send(product);
                } else {
                    res.status(404).send("Product not found");
                }
            } else {
                res.status(400).send("Product ID is required");
            }
        } catch (parseError) {
            console.log(parseError);
            res.status(500).send('Error parsing data file');
        }
    });
});


app.post('/products', async (req, res) => {
    try {
        const body = req.body;
        if (!body.productname || !body.category || !body.description) {
            return res.status(400).send('Fill in all data of products');
        }

        const { productname, category, description } = body;

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let products = dataObj.products;

                if (!Array.isArray(products)) {
                    products = [];
                }

                const productid = uuid.v4();
                products.push({ productid, productname, category, description });

                // Preserve existing shops and other data
                const newData = { ...dataObj, products: products };

                fs.writeFile(fname, JSON.stringify(newData), 'utf-8', function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Internal Server Error");
                    }
                    res.status(201).send('Product added successfully');
                });
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.put('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const body = req.body;

        if (!body.productname || !body.category || !body.description) {
            return res.status(400).send('Fill in all data of the product');
        }

        const { productname, category, description } = body;

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let products = dataObj.products;

                if (!Array.isArray(products)) {
                    products = [];
                }

                const existingProductIndex = products.findIndex(product => product.productid == productId);

                if (existingProductIndex !== -1) {
                    // Update the existing product
                    products[existingProductIndex] = {
                        productid: productId,
                        productname: productname,
                        category: category,
                        description: description
                    };

                    // Preserve existing shops and other data
                    const newData = { ...dataObj, products: products };

                    fs.writeFile(fname, JSON.stringify(newData), 'utf-8', function (err) {
                        if (err) {
                            console.log(err);
                            return res.status(500).send("Internal Server Error");
                        }
                        res.send('Product updated successfully');
                    });
                } else {
                    res.status(404).send('Product not found');
                }
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/purchases', async (req, res) => {
    try {
        const shopid = req.query.shop;
        const productids = req.query.product ? req.query.product.split(',').map(Number) : [];
        const sort = req.query.sort;

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let purchases = dataObj.purchases;

                if (!Array.isArray(purchases)) {
                    purchases = [];
                }

                let filteredPurchases = [...purchases];

                if (shopid) {
                    filteredPurchases = filteredPurchases.filter((purchase) => purchase.shopid === parseInt(shopid));
                }

                if (productids.length > 0) {
                    filteredPurchases = filteredPurchases.filter((purchase) => productids.includes(purchase.productid));
                }

                if (sort) {
                    switch (sort) {
                        case 'QtyAsc':
                            filteredPurchases.sort((a, b) => a.quantity - b.quantity);
                            break;
                        case 'QtyDesc':
                            filteredPurchases.sort((a, b) => b.quantity - a.quantity);
                            break;
                        case 'ValueAsc':
                            filteredPurchases.sort((a, b) => (a.quantity * a.price) - (b.quantity * b.price));
                            break;
                        case 'ValueDesc':
                            filteredPurchases.sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price));
                            break;
                        default:
                            break;
                    }
                }

                res.send(filteredPurchases);
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/purchases/shops/:id', async (req, res) => {
    try {
        const shopid = req.params.id;

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let purchases = dataObj.purchases;

                if (!Array.isArray(purchases)) {
                    purchases = [];
                }

                const purchasesForShop = purchases.filter((purchase) => purchase.shopid === parseInt(shopid));

                res.send(purchasesForShop);
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/purchases/products/:id', async (req, res) => {
    try {
        const productid = req.params.id;

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let purchases = dataObj.purchases;

                if (!Array.isArray(purchases)) {
                    purchases = [];
                }

                const purchasesForProduct = purchases.filter((purchase) => purchase.productid == productid);

                res.send(purchasesForProduct);
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/totalPurchase/shop/:id', async (req, res) => {
    try {
        const shopid = req.params.id;

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let purchases = dataObj.purchases;

                if (!Array.isArray(purchases)) {
                    purchases = [];
                }

                const totalPurchaseForShop = purchases
                    .filter((purchase) => purchase.shopid === parseInt(shopid))
                    .reduce((acc, purchase) => {
                        const { productid, quantity, price } = purchase;

                        if (!acc[productid]) {
                            acc[productid] = {
                                productid,
                                totalquantity: 0,
                                totalvalue: 0,
                            };
                        }

                        acc[productid].totalquantity += quantity;
                        acc[productid].totalvalue += price * quantity;

                        return acc;
                    }, {});

                const result = Object.values(totalPurchaseForShop);

                res.send(result);
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/totalPurchase/product/:id', async (req, res) => {
    try {
        const productid = req.params.id;

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let purchases = dataObj.purchases;

                if (!Array.isArray(purchases)) {
                    purchases = [];
                }

                const totalPurchaseForProduct = purchases
                    .filter((purchase) => purchase.productid == productid)
                    .reduce((acc, purchase) => {
                        const { shopid, quantity, price } = purchase;

                        if (!acc[shopid]) {
                            acc[shopid] = {
                                shopid,
                                totalquantity: 0,
                                totalvalue: 0,
                            };
                        }

                        acc[shopid].totalquantity += quantity;
                        acc[shopid].totalvalue += price * quantity;

                        return acc;
                    }, {});

                const result = Object.values(totalPurchaseForProduct);

                res.send(result);
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/purchases', async (req, res) => {
    try {
        const body = req.body;
        if (!body.shopid || !body.productid || !body.quantity || !body.price) {
            return res.status(400).send("All purchase data must be provided.");
        }

        fs.readFile(fname, 'utf-8', function (err, fileData) {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                let dataObj = JSON.parse(fileData);
                let purchases = dataObj.purchases;

                if (!Array.isArray(purchases)) {
                    purchases = [];
                }

                const purchaseid = uuid.v4();
                purchases.push({ purchaseid, ...body });

                // Preserve existing purchases and other data
                const newData = { ...dataObj, purchases: purchases };

                fs.writeFile(fname, JSON.stringify(newData), 'utf-8', function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Internal Server Error");
                    }
                    res.status(201).send(`Purchase added with ID: ${purchaseid}`);
                });
            } catch (parseError) {
                console.log(parseError);
                return res.status(500).send("Error parsing data file");
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
