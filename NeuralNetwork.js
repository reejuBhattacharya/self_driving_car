class NeuralNetwork {
    constructor(neuronCounts) {
        this.layers = [];
        for(let i=0; i<neuronCounts.length-1; i++) {
            this.layers.push(new Layer(neuronCounts[i], neuronCounts[i+1]));
        }
    }

    // the general feed forward algo for the whole network. References the internal ff algo
    static feedForward(inputs, network) {
        let outputs = Layer.feedForward(
            inputs, network.layers[0]
        );
        for(let i=1; i<network.layers.length; i++) {
            outputs = Layer.feedForward(outputs, network.layers[i]);
        }
        return outputs;
    }

    // mutates the weights and the biases based on a specified amount
    static mutate(network,amount){
        network.layers.forEach(level => {
            for(let i=0;i<level.biases.length;i++){
                level.biases[i]=lerp(
                    level.biases[i],
                    Math.random()*2-1,
                    amount
                )
            }
            for(let i=0;i<level.weights.length;i++){
                for(let j=0;j<level.weights[i].length;j++){
                    level.weights[i][j]=lerp(
                        level.weights[i][j],
                        Math.random()*2-1,
                        amount
                    )
                }
            }
        });
    }
}


class Layer {
    constructor(inputNo, outputNo) {
        this.inputs = new Array(inputNo);
        this.outputs = new Array(outputNo);
        this.biases = new Array(outputNo);

        this.weights = [];
        for(let i=0; i<inputNo; i++) {
            this.weights[i] = new Array(outputNo);
        }

        Layer.#generateRandom(this);
    }

    // used to initialize the network layer
    static #generateRandom(layer) {
        for(let i=0; i<layer.inputs.length; i++) {
            for(let j=0; j<layer.outputs.length; j++) {
                layer.weights[i][j] = Math.random()*2 -1;
            }
        }

        for(let i=0; i<layer.biases.length; i++) {
            layer.biases[i] = Math.random()*2 -1;    
        }
    }

    // the main feedforward algorithm. Uses simple linear regression based approach
    static feedForward(inputs, layer) {
        // copy the inputs
        for(let i=0; i<layer.inputs.length; i++) {
            layer.inputs[i] = inputs[i];
        }

        // calculate the outputs
        for(let i=0; i<layer.outputs.length; i++) {
            let score = 0;
            for(let j=0; j<layer.inputs.length; j++) {
                score += layer.inputs[j]*layer.weights[j][i];
            }

            if(score>layer.biases[i])
                layer.outputs[i] = 1;
            else 
                layer.outputs[i] = 0;
        }
        return layer.outputs;
    }

    
}