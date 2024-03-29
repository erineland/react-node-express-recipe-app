import React, { Component } from 'react';
import '../../scss/application.scss';
import {
    ListGroup,
    ListGroupItem,
    ListGroupItemHeading,
    ListGroupItemText,
    InputGroupAddon,
    InputGroup,
    InputGroupButton,
    Input,
    Button,
    Container,
    Row,
    Col,
    Alert
} from 'reactstrap';

class RecipeListWithFilter extends Component {
    constructor(props) {
        super(props);
        this.state = {
            recipes: this.props.recipes,
            inputField: undefined,
            userFavourites: undefined,
            showOnlyFavourites: false,
            favouritesButtonActive: false,
            searchButtonActive: false,
            error: undefined
        };
        this.handleRecipeSearch = this.handleRecipeSearch.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.updateInputValue = this.updateInputValue.bind(this);
        this.addFavourite = this.addFavourite.bind(this);
        this.removeFavourite = this.removeFavourite.bind(this);
        this.toggleFavourites = this.toggleFavourites.bind(this);
    }

    handleRecipeSearch() {
        if (!this.state.searchButtonActive && this.state.inputfield) {
            //Filter list based on filter value.
            //if matches an ingredient or recipe name or cooking time, it's a match.
            var filteredRecipes = this.props.recipeService.filterRecipes(this.props.recipes, this.state.inputfield);

            this.setState({
                recipes: filteredRecipes,
                searchButtonActive: true
            });
        } else if (this.state.searchButtonActive) {
            //show all recipes again.
            this.setState({
                recipes: this.props.recipes,
                searchButtonActive: false,
            })
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            this.handleRecipeSearch();
        }
    }

    componentDidUpdate(previousProps, previousState) {
        //check if props have changed, otherwise do nothing.
        if (!this.props.recipeService.compareRecipeLists(previousProps.recipes, this.props.recipes)) {
            this.setState({
                recipes: this.props.recipes
            });
        }
    }

    componentDidMount() {
        //TODO: move this function to run when render has finished
        //retrieve user profile and find user favourites;
        if (this.props.auth.isAuthenticated()) {
            let storedUserProfile = this.props.auth.getUserProfile();

            //go and get favourites
            this.props.recipeService.getUserFavourites(storedUserProfile.sub, true).then((favourites) => {
                //if DIFFERENT to favourites on STATE
                this.setState({
                    userFavourites: favourites,
                    error: undefined
                });
            }).catch((error) => {
                console.log('an error occurred retrieving user favourites');
                this.setState({
                    error: 'An error occurred retrieving favourites: ' + JSON.stringify(error)
                });
            });
        }
    }

    updateInputValue(evt) {
        this.setState({
            inputfield: evt.target.value
        });
    }

    toggleFavourites() {
        this.setState({
            showOnlyFavourites: !this.state.showOnlyFavourites,
            favouritesButtonActive: !this.state.favouritesButtonActive
        })
    }

    addFavourite(recipeId) {
        let userId = this.props.auth.getUserProfile().sub;

        //mark the recipe for this user as a favourite on the server.
        if (this.props.auth.isAuthenticated() && userId) {
            this.props.recipeService.addFavouriteRecipeToUser(userId, recipeId)
                .then((updatedUserFavourites) => {
                    this.setState({
                        userFavourites: updatedUserFavourites,
                        error: undefined
                    });
                })
                .catch((error) => {
                    console.log(error);
                    this.setState({
                        error: 'An error occurred when adding favourite: ' + JSON.stringify(error)
                    });
                })
        } else {
            //TODO: display notification to tell user this didn't happen
        }
    }

    removeFavourite(recipeId) {
        let userId = this.props.auth.getUserProfile().sub;

        //mark the recipe for this user as a favourite on the server.
        if (this.props.auth.isAuthenticated() && userId) {
            this.props.recipeService.removeFavouriteRecipeFromUser(userId, recipeId)
                .then((updatedUserFavourites) => {
                    this.setState({
                        userFavourites: updatedUserFavourites,
                        error: undefined
                    });
                })
                .catch((error) => {
                    console.log(error);
                    this.setState({
                        error: 'An error occurred when retrieving favourite recipes: ' + JSON.stringify(error)
                    })
                })
        }
    }

    render() {
        let recipeList = this.state.recipes;

        //map favourites onto list of available recipes.
        if (this.state.userFavourites) {

            this.state.recipes.forEach((recipe, i) => {
                this.state.recipes[i]['isFavourite'] = false;
            });

            this.state.userFavourites.forEach((favouriteRecipe, index) => {
                //find recipe with correspongind id and mark as a favourite
                for (let i = 0; i < this.state.recipes.length; i++) {
                    if (favouriteRecipe._id == this.state.recipes[i]._id) {
                        this.state.recipes[i]['isFavourite'] = true;
                    }
                }
            });
        }

        if (this.state.showOnlyFavourites) {
            //filter the non-favourites out of the copy of the recipe list, which is used for display
            recipeList = recipeList.filter((recipe) => {
                for (let i = 0; i < this.state.userFavourites.length; i++) {
                    if (this.state.userFavourites[i]._id === recipe._id) {
                        return true;
                    }
                }
            });
        }

        //Render image, name, cooking time, ingredients.
        return (
            <Container className="recipe-list-container">
                {this.state.error ? <Alert color='danger'>{this.state.error}</Alert> : undefined}
                {this.props.auth.isAuthenticated() ? undefined : <Alert color='info'>To save your favourite recipes for quicker access, please sign up or log in!</Alert>}
                <Row>
                    <Col>
                        <InputGroup>
                            {this.props.auth.isAuthenticated() ? <InputGroupButton onClick={this.toggleFavourites} color="secondary">
                                {this.state.favouritesButtonActive ? 'Show All' : 'Show Starred Recipes'}
                            </InputGroupButton> : undefined}
                            <Input ref="filterField" onKeyPress={this.handleKeyPress} onChange={this.updateInputValue} placeholder="Filter recipes here..." />
                            <InputGroupButton color="secondary" onClick={this.handleRecipeSearch}>
                                {this.state.searchButtonActive ? 'Show All' : 'Search'}
                            </InputGroupButton>
                        </InputGroup>
                    </Col>
                </Row>
                <br />
                {recipeList ?
                    recipeList.length > 0 ?
                        <Row>
                            <Col className="recipe-list">
                                <ListGroup>
                                    {recipeList.map((recipe, index, recipes) => {

                                        let favouriteButton = undefined;

                                        if (this.props.auth.isAuthenticated()) {
                                            recipe.isFavourite ?
                                                favouriteButton = <Button onClick={() => { this.removeFavourite(recipe._id) }} color="danger" className="favourite-btn">Unstar Recipe</Button>
                                                : favouriteButton = <Button onClick={() => { this.addFavourite(recipe._id) }} color="success" className="favourite-btn">Star Recipe</Button>
                                        }

                                        return <ListGroupItem key={index}>
                                            <ListGroupItemHeading tag="a" href={`/recipe/${recipe._id}`}>{recipe.name}</ListGroupItemHeading>
                                            <ListGroupItemText className="recipe-list-cooking-time">
                                                Cooking Time: {recipe.cookingTime} {favouriteButton}
                                            </ListGroupItemText>
                                            <ListGroupItemText>
                                                Main Ingredients: {recipe.mainIngredients.join(', ')}
                                            </ListGroupItemText>
                                        </ListGroupItem>
                                    })}
                                </ListGroup>
                            </Col>
                        </Row>
                        : this.state.showOnlyFavourites ?
                            <Alert color='warning'>Sorry, you don't currently have any starred recipes, get started by starring recipes you like</Alert>
                            : this.state.searchButtonActive ?
                                <Alert color='warning'>Sorry, nothing matched your filter term</Alert>
                                : <Alert color='warning'>Sorry, we currently have no recipes for you</Alert>
                    : <Alert color='warning'>Sorry, we currently have no recipes for you</Alert>
                }
            </Container>);
    }
}
module.exports = RecipeListWithFilter;